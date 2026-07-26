const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

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
    notes: proposal.notes || 'N/A',
    status: 'Pending',
    submittedAt: new Date().toISOString()
  };

  proposals.push(newProposal);

  res.status(201).json({
    message: 'Session proposal submitted successfully.',
    status: 'success',
    proposal: newProposal
  });
});

app.patch('/api/proposals/:id/status', function (req, res) {
  const proposalId = Number(req.params.id);
  const newStatus = req.body.status;

  if (!['Approved', 'Rejected', 'Pending'].includes(newStatus)) {
    return res.status(400).json({
      message: 'Status must be Approved, Rejected, or Pending.',
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

  res.json({
    message: 'Proposal status updated successfully.',
    status: 'success',
    proposal: proposal
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
// DEFAULT HOMEPAGE REDIRECT
// -------------------------

app.get('/', function (req, res) {
  res.redirect('/html/index.html');
});

// -------------------------
// SERVER START
// -------------------------

app.listen(PORT, function () {
  console.log('TechConnect 2026 API running at http://localhost:' + PORT);
  console.log('Open homepage at http://localhost:' + PORT + '/html/index.html');
  console.log('Health check: http://localhost:' + PORT + '/api/health');
});