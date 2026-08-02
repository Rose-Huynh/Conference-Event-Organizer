require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'techconnect2026'
    });
    console.log('Connected to MongoDB successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve the existing project folders/files
app.use(express.static(path.join(__dirname)));

// In-memory storage for this assignment
let proposals = [];
let billingDetails = [];
let returnRequests = [];
let carts = [];

// Data loaded from existing JSON files
let products = loadJsonFile('data/products.json').map(normalizeProduct);
let sessions = loadJsonFile('data/sessions.json').map(normalizeSession);
let attendees = loadJsonFile('data/attendees.json').map(normalizeAttendee);
let finalizations = [];

// -------------------------
// DATA SEED HELPERS
// -------------------------

function loadJsonFile(relativePath) {
  try {
    const filePath = path.join(__dirname, relativePath);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function normalizeProduct(product) {
  return {
    productId: product.productId || 'P' + Date.now(),
    name: product.name || product.description || '',
    description: product.description || 'N/A',
    category: product.category || '',
    unitOfMeasure: product.unitOfMeasure || '',
    price: Number(product.price || 0).toFixed(2),
    additionalInfo: product.additionalInfo || 'N/A'
  };
}

function normalizeSession(session) {
  return {
    sessionId: session.sessionId || session.productId || 'S' + Date.now(),
    title: session.title || session.description || '',
    type: session.type || session.category || '',
    format: session.format || session.unitOfMeasure || '',
    price: Number(session.price || 0).toFixed(2),
    description: session.description || session.title || 'N/A',
    additionalInfo: session.additionalInfo || 'N/A'
  };
}

function normalizeAttendee(attendee, index) {
  return {
    id: attendee.id || Date.now() + index,
    fullName: attendee.fullName || attendee.name || '',
    email: attendee.email || '',
    phone: attendee.phone || 'N/A',
    age: Number(attendee.age) || 18,
    affiliation: attendee.affiliation || 'Other / Guest'
  };
}

function normalizeProposalStatus(status) {
  const value = String(status || 'pending').toLowerCase();

  if (!['pending', 'approved', 'rejected'].includes(value)) {
    return null;
  }

  return value;
}

// -------------------------
// HEALTH CHECK
// -------------------------

app.get('/api/health', function (req, res) {
  res.json({
    message: 'TechConnect 2026 Node.js API is running.',
    status: 'success'
  });
});

// -------------------------
// SESSION PROPOSALS
// -------------------------

app.get('/api/proposals', function (req, res) {
  res.json(proposals);
});

app.post('/api/proposals', function (req, res) {
  const proposal = req.body;

  if (
    !proposal.title ||
    !proposal.abstract ||
    !proposal.speakerName ||
    !proposal.speakerEmail ||
    !proposal.category ||
    !proposal.format
  ) {
    return res.status(400).json({
      message: 'Missing required proposal fields.',
      status: 'error'
    });
  }

  const newProposal = {
    id: Date.now(),
    title: proposal.title,
    abstract: proposal.abstract,
    speakerName: proposal.speakerName,
    speakerEmail: proposal.speakerEmail,
    category: proposal.category,
    format: proposal.format,
    durationMinutes: Number(proposal.durationMinutes) || 30,
    notes: proposal.notes || 'N/A',
    status: normalizeProposalStatus(proposal.status) || 'pending',
    submittedAt: proposal.submittedAt || new Date().toISOString()
  };

  proposals.push(newProposal);

  res.status(201).json({
    message: 'Session proposal submitted successfully.',
    status: 'success',
    proposal: newProposal
  });
});

function updateProposalStatus(req, res) {
  const proposalId = Number(req.params.id);
  const newStatus = normalizeProposalStatus(req.body.status);

  if (!newStatus) {
    return res.status(400).json({
      message: 'Status must be pending, approved, or rejected.',
      status: 'error'
    });
  }

  const proposal = proposals.find(function (item) {
    return item.id === proposalId;
  });

  if (!proposal) {
    return res.status(404).json({
      message: 'Proposal not found.',
      status: 'error'
    });
  }

  proposal.status = newStatus;
  proposal.reviewedAt = new Date().toISOString();

  res.json(proposal);
}

app.patch('/api/proposals/:id/status', updateProposalStatus);

// -------------------------
// PRODUCTS API
// -------------------------

app.get('/api/products', function (req, res) {
  res.json(products);
});

app.post('/api/products', function (req, res) {
  const product = normalizeProduct(req.body);

  if (
    !product.productId ||
    !product.name ||
    !product.description ||
    !product.category ||
    !product.unitOfMeasure
  ) {
    return res.status(400).json({
      message: 'Missing required product fields.',
      status: 'error'
    });
  }

  products.push(product);

  res.status(201).json({
    message: 'Product saved successfully.',
    status: 'success',
    product: product
  });
});

app.put('/api/products/:productId', function (req, res) {
  const productId = req.params.productId;

  const index = products.findIndex(function (item) {
    return item.productId === productId;
  });

  if (index === -1) {
    return res.status(404).json({
      message: 'Product not found.',
      status: 'error'
    });
  }

  products[index] = normalizeProduct({
    ...req.body,
    productId: productId
  });

  res.json({
    message: 'Product updated successfully.',
    status: 'success',
    product: products[index]
  });
});

app.delete('/api/products/:productId', function (req, res) {
  const productId = req.params.productId;

  products = products.filter(function (item) {
    return item.productId !== productId;
  });

  res.json({
    message: 'Product deleted successfully.',
    status: 'success'
  });
});

// -------------------------
// SESSIONS API
// -------------------------

app.get('/api/sessions', function (req, res) {
  res.json(sessions);
});

app.post('/api/sessions', function (req, res) {
  const session = normalizeSession(req.body);

  if (
    !session.sessionId ||
    !session.title ||
    !session.type ||
    !session.format
  ) {
    return res.status(400).json({
      message: 'Missing required session fields.',
      status: 'error'
    });
  }

  sessions.push(session);

  res.status(201).json({
    message: 'Session saved successfully.',
    status: 'success',
    session: session
  });
});

app.put('/api/sessions/:sessionId', function (req, res) {
  const sessionId = req.params.sessionId;

  const index = sessions.findIndex(function (item) {
    return item.sessionId === sessionId;
  });

  if (index === -1) {
    return res.status(404).json({
      message: 'Session not found.',
      status: 'error'
    });
  }

  sessions[index] = normalizeSession({
    ...req.body,
    sessionId: sessionId
  });

  res.json({
    message: 'Session updated successfully.',
    status: 'success',
    session: sessions[index]
  });
});

app.delete('/api/sessions/:sessionId', function (req, res) {
  const sessionId = req.params.sessionId;

  sessions = sessions.filter(function (item) {
    return item.sessionId !== sessionId;
  });

  res.json({
    message: 'Session deleted successfully.',
    status: 'success'
  });
});

// -------------------------
// ATTENDEES API
// -------------------------

app.get('/api/attendees', function (req, res) {
  res.json(attendees);
});

app.post('/api/attendees', function (req, res) {
  const attendee = normalizeAttendee(req.body, attendees.length);

  if (
    !attendee.fullName ||
    !attendee.email ||
    !attendee.age ||
    !attendee.affiliation
  ) {
    return res.status(400).json({
      message: 'Missing required attendee fields.',
      status: 'error'
    });
  }

  attendees.push(attendee);

  res.status(201).json({
    message: 'Attendee saved successfully.',
    status: 'success',
    attendee: attendee
  });
});

app.put('/api/attendees/:id', function (req, res) {
  const attendeeId = Number(req.params.id);

  const index = attendees.findIndex(function (item) {
    return Number(item.id) === attendeeId;
  });

  if (index === -1) {
    return res.status(404).json({
      message: 'Attendee not found.',
      status: 'error'
    });
  }

  attendees[index] = normalizeAttendee({
    ...req.body,
    id: attendeeId
  }, index);

  res.json({
    message: 'Attendee updated successfully.',
    status: 'success',
    attendee: attendees[index]
  });
});

app.delete('/api/attendees/:id', function (req, res) {
  const attendeeId = Number(req.params.id);

  attendees = attendees.filter(function (item) {
    return Number(item.id) !== attendeeId;
  });

  res.json({
    message: 'Attendee deleted successfully.',
    status: 'success'
  });
});

// -------------------------
// BILLING DETAILS
// -------------------------

app.get('/api/billing', function (req, res) {
  res.json(billingDetails);
});

app.post('/api/billing', function (req, res) {
  const billing = req.body;

  if (
    !billing.fullName ||
    !billing.address ||
    !billing.cardNumber ||
    !billing.expirationDate ||
    !billing.securityCode
  ) {
    return res.status(400).json({
      message: 'Missing required billing fields.',
      status: 'error'
    });
  }

  const newBilling = {
    id: Date.now(),
    fullName: billing.fullName,
    address: billing.address,
    city: billing.city || 'N/A',
    state: billing.state || 'N/A',
    zipCode: billing.zipCode || 'N/A',
    cardLastFour: String(billing.cardNumber).slice(-4),
    expirationDate: billing.expirationDate,
    orderSummary: billing.orderSummary || [],
    totalAmount: billing.totalAmount || 0,
    shippingDetails: billing.shippingDetails || 'Standard Shipping',
    submittedAt: new Date().toISOString()
  };

  billingDetails.push(newBilling);

  res.status(201).json({
    message: 'Billing details processed successfully.',
    status: 'success',
    billing: newBilling
  });
});

// -------------------------
// RETURN REQUESTS
// -------------------------

app.get('/api/returns', function (req, res) {
  res.json(returnRequests);
});

app.post('/api/returns', function (req, res) {
  const returnRequest = req.body;

  if (
    !returnRequest.productName ||
    !returnRequest.price ||
    !returnRequest.reason ||
    !returnRequest.condition
  ) {
    return res.status(400).json({
      message: 'Missing required return request fields.',
      status: 'error'
    });
  }

  const newReturnRequest = {
    id: Date.now(),
    productName: returnRequest.productName,
    price: returnRequest.price,
    reason: returnRequest.reason,
    condition: returnRequest.condition,
    notes: returnRequest.notes || 'N/A',
    status: 'Pending',
    submittedAt: new Date().toISOString()
  };

  returnRequests.push(newReturnRequest);

  res.status(201).json({
    message: 'Return request submitted successfully.',
    status: 'success',
    returnRequest: newReturnRequest
  });
});

app.patch('/api/returns/:id/status', function (req, res) {
  const returnId = Number(req.params.id);
  const newStatus = req.body.status;

  if (!['Approved', 'Rejected', 'Pending'].includes(newStatus)) {
    return res.status(400).json({
      message: 'Status must be Approved, Rejected, or Pending.',
      status: 'error'
    });
  }

  const returnRequest = returnRequests.find(function (item) {
    return item.id === returnId;
  });

  if (!returnRequest) {
    return res.status(404).json({
      message: 'Return request not found.',
      status: 'error'
    });
  }

  returnRequest.status = newStatus;
  returnRequest.reviewedAt = new Date().toISOString();

  res.json({
    message: 'Return request status updated successfully.',
    status: 'success',
    returnRequest: returnRequest
  });
});

// -------------------------
// CART API
// -------------------------

app.get('/api/cart', function (req, res) {
  res.json(carts);
});

app.post('/api/cart', function (req, res) {
  const cart = req.body;

  if (!cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
    return res.status(400).json({
      message: 'Cart must contain at least one item.',
      status: 'error'
    });
  }

  const newCart = {
    id: Date.now(),
    cartId: cart.cartId || 'N/A',
    event: cart.event || 'TechConnect 2026',
    items: cart.items,
    total: cart.total || 0,
    submittedAt: new Date().toISOString()
  };

  carts.push(newCart);

  res.status(201).json({
    message: 'Cart submitted successfully.',
    status: 'success',
    cart: newCart
  });
});

// -------------------------
// FINALIZATIONS API
// -------------------------

app.get('/api/finalizations', function (req, res) {
  res.json(finalizations);
});

app.post('/api/finalizations', function (req, res) {
  const finalization = req.body;

  if (
    !finalization.fullName ||
    !finalization.email ||
    !finalization.participationType ||
    !finalization.preferredSessionType ||
    !finalization.selectedSessions ||
    finalization.selectedSessions.length === 0
  ) {
    return res.status(400).json({
      message: 'Missing required finalization fields.',
      status: 'error'
    });
  }

  const newFinalization = {
    id: Date.now(),
    ...finalization,
    submittedAt: new Date().toISOString()
  };

  finalizations.push(newFinalization);

  res.status(201).json({
    message: 'Finalization submitted successfully.',
    status: 'success',
    finalization: newFinalization
  });
});

// -------------------------
// DEFAULT HOMEPAGE REDIRECT
// -------------------------

app.get('/', function (req, res) {
  res.redirect('/html/index.html');
});

// -------------------------
// SERVER START
// -------------------------

async function startServer() {
  await connectToDatabase();

  app.listen(PORT, function () {
    console.log('TechConnect 2026 API running at http://localhost:' + PORT);
    console.log('Open homepage at http://localhost:' + PORT + '/html/index.html');
    console.log('Health check: http://localhost:' + PORT + '/api/health');
  });
}

startServer();