require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// -------------------------
// DATABASE CONNECTION
// -------------------------

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

// -------------------------
// MIDDLEWARE
// -------------------------

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// -------------------------
// MONGOOSE SCHEMAS / MODELS
// -------------------------

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  unitOfMeasure: { type: String, required: true },
  price: { type: Number, default: 0 },
  additionalInfo: { type: String, default: 'N/A' }
}, { timestamps: true, versionKey: false });

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  format: { type: String, required: true },
  price: { type: Number, default: 0 },
  description: { type: String, default: 'N/A' },
  additionalInfo: { type: String, default: 'N/A' }
}, { timestamps: true, versionKey: false });

const attendeeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: 'N/A' },
  age: { type: Number, required: true },
  affiliation: { type: String, required: true }
}, { timestamps: true, versionKey: false, id: false });

const proposalSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  speakerName: { type: String, required: true },
  speakerEmail: { type: String, required: true },
  category: { type: String, required: true },
  format: { type: String, required: true },
  durationMinutes: { type: Number, default: 30 },
  notes: { type: String, default: 'N/A' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date
}, { timestamps: true, versionKey: false, id: false });

const cartSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  cartId: { type: String, default: 'N/A' },
  event: { type: String, default: 'TechConnect 2026' },
  items: { type: Array, default: [] },
  total: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false, id: false });

const billingSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  billingId: { type: String, default: 'N/A' },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, default: 'N/A' },
  state: { type: String, default: 'N/A' },
  zipCode: { type: String, default: 'N/A' },
  cardLastFour: { type: String, required: true },
  expirationDate: { type: String, required: true },
  orderSummary: { type: Array, default: [] },
  totalAmount: { type: Number, default: 0 },
  shippingDetails: { type: String, default: 'Standard Shipping' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false, id: false });

const shippingSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  shippingId: { type: String, default: 'N/A' },
  fullName: { type: String, default: 'N/A' },
  address: { type: String, default: 'N/A' },
  city: { type: String, default: 'N/A' },
  state: { type: String, default: 'N/A' },
  zipCode: { type: String, default: 'N/A' },
  shippingMethod: { type: String, default: 'Standard Shipping' },
  relatedBillingId: { type: String, default: 'N/A' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false, id: false });

const returnRequestSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  returnId: { type: String, default: 'N/A' },
  productId: { type: String, default: 'N/A' },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  reason: { type: String, required: true },
  condition: { type: String, required: true },
  notes: { type: String, default: 'N/A' },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date
}, { timestamps: true, versionKey: false, id: false });

const finalizationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  finalizationId: { type: String, default: 'N/A' },
  attendeeId: { type: String, default: 'N/A' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  participationType: { type: String, required: true },
  preferredSessionType: { type: String, required: true },
  selectedSessions: { type: Array, default: [] },
  mealPreference: { type: String, default: 'N/A' },
  finalNotes: { type: String, default: 'N/A' },
  confirmedAttendance: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false, id: false });

const Product = mongoose.model('Product', productSchema, 'products');
const Session = mongoose.model('Session', sessionSchema, 'sessions');
const Attendee = mongoose.model('Attendee', attendeeSchema, 'attendees');
const Proposal = mongoose.model('Proposal', proposalSchema, 'proposals');
const ShoppingCart = mongoose.model('ShoppingCart', cartSchema, 'shoppingCart');
const Billing = mongoose.model('Billing', billingSchema, 'billing');
const Shipping = mongoose.model('Shipping', shippingSchema, 'shipping');
const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema, 'returns');
const Finalization = mongoose.model('Finalization', finalizationSchema, 'finalizations');

// -------------------------
// HELPERS
// -------------------------

function asyncHandler(callback) {
  return function (req, res, next) {
    Promise.resolve(callback(req, res, next)).catch(next);
  };
}

function generateNumericId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function loadJsonFile(relativePath) {
  try {
    const filePath = path.join(__dirname, relativePath);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function cleanDocument(document) {
  const item = document.toObject ? document.toObject() : { ...document };

  delete item._id;
  delete item.__v;

  return item;
}

function formatProductForClient(product) {
  const item = cleanDocument(product);
  item.price = Number(item.price || 0).toFixed(2);
  return item;
}

function formatSessionForClient(session) {
  const item = cleanDocument(session);
  item.price = Number(item.price || 0).toFixed(2);
  return item;
}

function normalizeProduct(product) {
  return {
    productId: product.productId || 'P' + generateNumericId(),
    name: product.name || product.description || '',
    description: product.description || product.name || 'N/A',
    category: product.category || '',
    unitOfMeasure: product.unitOfMeasure || '',
    price: Number(product.price || 0),
    additionalInfo: product.additionalInfo || 'N/A'
  };
}

function normalizeSession(session) {
  return {
    sessionId: session.sessionId || session.productId || 'S' + generateNumericId(),
    title: session.title || session.description || '',
    type: session.type || session.category || '',
    format: session.format || session.unitOfMeasure || '',
    price: Number(session.price || 0),
    description: session.description || session.title || 'N/A',
    additionalInfo: session.additionalInfo || 'N/A'
  };
}

function normalizeAttendee(attendee, index = 0) {
  const existingId = Number(attendee.id);

  return {
    id: Number.isFinite(existingId) && existingId > 0 ? existingId : generateNumericId() + index,
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

function normalizeReturnStatus(status) {
  const value = String(status || 'Pending');

  if (!['Pending', 'Approved', 'Rejected'].includes(value)) {
    return null;
  }

  return value;
}

async function seedCollectionIfEmpty(Model, relativePath, normalizer) {
  const count = await Model.countDocuments();

  if (count > 0) {
    console.log(Model.collection.name + ' already has data. Skipping seed.');
    return;
  }

  const data = loadJsonFile(relativePath).map(normalizer);

  if (data.length > 0) {
    await Model.insertMany(data);
    console.log('Seeded ' + data.length + ' documents into ' + Model.collection.name + '.');
  }
}

async function seedDatabase() {
  await seedCollectionIfEmpty(Product, 'public/data/products.json', normalizeProduct);
  await seedCollectionIfEmpty(Session, 'public/data/sessions.json', normalizeSession);
  await seedCollectionIfEmpty(Attendee, 'public/data/attendees.json', normalizeAttendee);
}

// -------------------------
// HEALTH CHECK
// -------------------------

app.get('/api/health', function (req, res) {
  res.json({
    message: 'TechConnect 2026 Node.js API is running.',
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected'
  });
});

// -------------------------
// SESSION PROPOSALS
// -------------------------

app.get('/api/proposals', asyncHandler(async function (req, res) {
  const proposals = await Proposal.find().sort({ submittedAt: -1 });
  res.json(proposals.map(cleanDocument));
}));

app.post('/api/proposals', asyncHandler(async function (req, res) {
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
    id: generateNumericId(),
    title: proposal.title,
    abstract: proposal.abstract,
    speakerName: proposal.speakerName,
    speakerEmail: proposal.speakerEmail,
    category: proposal.category,
    format: proposal.format,
    durationMinutes: Number(proposal.durationMinutes) || 30,
    notes: proposal.notes || 'N/A',
    status: normalizeProposalStatus(proposal.status) || 'pending',
    submittedAt: proposal.submittedAt || new Date()
  };

  const savedProposal = await Proposal.create(newProposal);

  res.status(201).json({
    message: 'Session proposal submitted successfully.',
    status: 'success',
    proposal: cleanDocument(savedProposal)
  });
}));

app.patch('/api/proposals/:id/status', asyncHandler(async function (req, res) {
  const proposalId = Number(req.params.id);
  const newStatus = normalizeProposalStatus(req.body.status);

  if (!newStatus) {
    return res.status(400).json({
      message: 'Status must be pending, approved, or rejected.',
      status: 'error'
    });
  }

  const proposal = await Proposal.findOneAndUpdate(
    { id: proposalId },
    {
      status: newStatus,
      reviewedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  if (!proposal) {
    return res.status(404).json({
      message: 'Proposal not found.',
      status: 'error'
    });
  }

  res.json(cleanDocument(proposal));
}));

// -------------------------
// PRODUCTS API
// -------------------------

app.get('/api/products', asyncHandler(async function (req, res) {
  const products = await Product.find().sort({ productId: 1 });
  res.json(products.map(formatProductForClient));
}));

app.post('/api/products', asyncHandler(async function (req, res) {
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

  const existingProduct = await Product.findOne({ productId: product.productId });

  if (existingProduct) {
    return res.status(409).json({
      message: 'Product ID already exists.',
      status: 'error'
    });
  }

  const savedProduct = await Product.create(product);

  res.status(201).json({
    message: 'Product saved successfully.',
    status: 'success',
    product: formatProductForClient(savedProduct)
  });
}));

app.put('/api/products/:productId', asyncHandler(async function (req, res) {
  const productId = req.params.productId;

  const product = normalizeProduct({
    ...req.body,
    productId: productId
  });

  const updatedProduct = await Product.findOneAndUpdate(
    { productId: productId },
    product,
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    return res.status(404).json({
      message: 'Product not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Product updated successfully.',
    status: 'success',
    product: formatProductForClient(updatedProduct)
  });
}));

app.delete('/api/products/:productId', asyncHandler(async function (req, res) {
  const productId = req.params.productId;

  const deletedProduct = await Product.findOneAndDelete({ productId: productId });

  if (!deletedProduct) {
    return res.status(404).json({
      message: 'Product not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Product deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// SESSIONS API
// -------------------------

app.get('/api/sessions', asyncHandler(async function (req, res) {
  const sessions = await Session.find().sort({ sessionId: 1 });
  res.json(sessions.map(formatSessionForClient));
}));

app.post('/api/sessions', asyncHandler(async function (req, res) {
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

  const existingSession = await Session.findOne({ sessionId: session.sessionId });

  if (existingSession) {
    return res.status(409).json({
      message: 'Session ID already exists.',
      status: 'error'
    });
  }

  const savedSession = await Session.create(session);

  res.status(201).json({
    message: 'Session saved successfully.',
    status: 'success',
    session: formatSessionForClient(savedSession)
  });
}));

app.put('/api/sessions/:sessionId', asyncHandler(async function (req, res) {
  const sessionId = req.params.sessionId;

  const session = normalizeSession({
    ...req.body,
    sessionId: sessionId
  });

  const updatedSession = await Session.findOneAndUpdate(
    { sessionId: sessionId },
    session,
    { new: true, runValidators: true }
  );

  if (!updatedSession) {
    return res.status(404).json({
      message: 'Session not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Session updated successfully.',
    status: 'success',
    session: formatSessionForClient(updatedSession)
  });
}));

app.delete('/api/sessions/:sessionId', asyncHandler(async function (req, res) {
  const sessionId = req.params.sessionId;

  const deletedSession = await Session.findOneAndDelete({ sessionId: sessionId });

  if (!deletedSession) {
    return res.status(404).json({
      message: 'Session not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Session deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// ATTENDEES API
// -------------------------

app.get('/api/attendees', asyncHandler(async function (req, res) {
  const attendees = await Attendee.find().sort({ id: 1 });
  res.json(attendees.map(cleanDocument));
}));

app.post('/api/attendees', asyncHandler(async function (req, res) {
  const attendee = normalizeAttendee(req.body);

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

  const savedAttendee = await Attendee.create(attendee);

  res.status(201).json({
    message: 'Attendee saved successfully.',
    status: 'success',
    attendee: cleanDocument(savedAttendee)
  });
}));

app.put('/api/attendees/:id', asyncHandler(async function (req, res) {
  const attendeeId = Number(req.params.id);

  const attendee = normalizeAttendee({
    ...req.body,
    id: attendeeId
  });

  const updatedAttendee = await Attendee.findOneAndUpdate(
    { id: attendeeId },
    attendee,
    { new: true, runValidators: true }
  );

  if (!updatedAttendee) {
    return res.status(404).json({
      message: 'Attendee not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Attendee updated successfully.',
    status: 'success',
    attendee: cleanDocument(updatedAttendee)
  });
}));

app.delete('/api/attendees/:id', asyncHandler(async function (req, res) {
  const attendeeId = Number(req.params.id);

  const deletedAttendee = await Attendee.findOneAndDelete({ id: attendeeId });

  if (!deletedAttendee) {
    return res.status(404).json({
      message: 'Attendee not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Attendee deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// CART API
// -------------------------

app.get('/api/cart', asyncHandler(async function (req, res) {
  const carts = await ShoppingCart.find().sort({ submittedAt: -1 });
  res.json(carts.map(cleanDocument));
}));

app.post('/api/cart', asyncHandler(async function (req, res) {
  const cart = req.body;

  if (!cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
    return res.status(400).json({
      message: 'Cart must contain at least one item.',
      status: 'error'
    });
  }

  const newCart = {
    id: generateNumericId(),
    cartId: cart.cartId || 'N/A',
    event: cart.event || 'TechConnect 2026',
    items: cart.items,
    total: Number(cart.total || 0),
    submittedAt: new Date()
  };

  const savedCart = await ShoppingCart.create(newCart);

  res.status(201).json({
    message: 'Cart submitted successfully.',
    status: 'success',
    cart: cleanDocument(savedCart)
  });
}));

app.put('/api/cart/:id', asyncHandler(async function (req, res) {
  const cartId = Number(req.params.id);

  const updatedCart = await ShoppingCart.findOneAndUpdate(
    { id: cartId },
    {
      items: req.body.items || [],
      total: Number(req.body.total || 0),
      event: req.body.event || 'TechConnect 2026'
    },
    { new: true, runValidators: true }
  );

  if (!updatedCart) {
    return res.status(404).json({
      message: 'Cart not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Cart updated successfully.',
    status: 'success',
    cart: cleanDocument(updatedCart)
  });
}));

app.delete('/api/cart/:id', asyncHandler(async function (req, res) {
  const cartId = Number(req.params.id);

  const deletedCart = await ShoppingCart.findOneAndDelete({ id: cartId });

  if (!deletedCart) {
    return res.status(404).json({
      message: 'Cart not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Cart deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// BILLING DETAILS
// -------------------------

app.get('/api/billing', asyncHandler(async function (req, res) {
  const billingDetails = await Billing.find().sort({ submittedAt: -1 });
  res.json(billingDetails.map(cleanDocument));
}));

app.post('/api/billing', asyncHandler(async function (req, res) {
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

  const numericId = generateNumericId();

  const newBilling = {
    id: numericId,
    billingId: billing.billingId || 'BILL-' + numericId,
    fullName: billing.fullName,
    address: billing.address,
    city: billing.city || 'N/A',
    state: billing.state || 'N/A',
    zipCode: billing.zipCode || 'N/A',
    cardLastFour: String(billing.cardNumber).slice(-4),
    expirationDate: billing.expirationDate,
    orderSummary: billing.orderSummary || [],
    totalAmount: Number(billing.totalAmount || 0),
    shippingDetails: billing.shippingDetails || 'Standard Shipping',
    submittedAt: new Date()
  };

  const savedBilling = await Billing.create(newBilling);

  await Shipping.create({
    id: generateNumericId(),
    shippingId: 'SHIP-' + numericId,
    fullName: billing.fullName,
    address: billing.address,
    city: billing.city || 'N/A',
    state: billing.state || 'N/A',
    zipCode: billing.zipCode || 'N/A',
    shippingMethod: billing.shippingDetails || 'Standard Shipping',
    relatedBillingId: newBilling.billingId,
    submittedAt: new Date()
  });

  res.status(201).json({
    message: 'Billing details processed successfully.',
    status: 'success',
    billing: cleanDocument(savedBilling)
  });
}));

app.delete('/api/billing/:id', asyncHandler(async function (req, res) {
  const billingId = Number(req.params.id);

  const deletedBilling = await Billing.findOneAndDelete({ id: billingId });

  if (!deletedBilling) {
    return res.status(404).json({
      message: 'Billing record not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Billing record deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// SHIPPING API
// -------------------------

app.get('/api/shipping', asyncHandler(async function (req, res) {
  const shippingRecords = await Shipping.find().sort({ submittedAt: -1 });
  res.json(shippingRecords.map(cleanDocument));
}));

app.post('/api/shipping', asyncHandler(async function (req, res) {
  const shipping = req.body;

  if (!shipping.fullName || !shipping.address) {
    return res.status(400).json({
      message: 'Missing required shipping fields.',
      status: 'error'
    });
  }

  const numericId = generateNumericId();

  const newShipping = {
    id: numericId,
    shippingId: shipping.shippingId || 'SHIP-' + numericId,
    fullName: shipping.fullName,
    address: shipping.address,
    city: shipping.city || 'N/A',
    state: shipping.state || 'N/A',
    zipCode: shipping.zipCode || 'N/A',
    shippingMethod: shipping.shippingMethod || 'Standard Shipping',
    relatedBillingId: shipping.relatedBillingId || 'N/A',
    submittedAt: new Date()
  };

  const savedShipping = await Shipping.create(newShipping);

  res.status(201).json({
    message: 'Shipping details saved successfully.',
    status: 'success',
    shipping: cleanDocument(savedShipping)
  });
}));

app.put('/api/shipping/:id', asyncHandler(async function (req, res) {
  const shippingId = Number(req.params.id);

  const updatedShipping = await Shipping.findOneAndUpdate(
    { id: shippingId },
    {
      fullName: req.body.fullName || 'N/A',
      address: req.body.address || 'N/A',
      city: req.body.city || 'N/A',
      state: req.body.state || 'N/A',
      zipCode: req.body.zipCode || 'N/A',
      shippingMethod: req.body.shippingMethod || 'Standard Shipping',
      relatedBillingId: req.body.relatedBillingId || 'N/A'
    },
    { new: true, runValidators: true }
  );

  if (!updatedShipping) {
    return res.status(404).json({
      message: 'Shipping record not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Shipping details updated successfully.',
    status: 'success',
    shipping: cleanDocument(updatedShipping)
  });
}));

app.delete('/api/shipping/:id', asyncHandler(async function (req, res) {
  const shippingId = Number(req.params.id);

  const deletedShipping = await Shipping.findOneAndDelete({ id: shippingId });

  if (!deletedShipping) {
    return res.status(404).json({
      message: 'Shipping record not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Shipping record deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// RETURN REQUESTS
// -------------------------

app.get('/api/returns', asyncHandler(async function (req, res) {
  const returnRequests = await ReturnRequest.find().sort({ submittedAt: -1 });
  res.json(returnRequests.map(cleanDocument));
}));

app.post('/api/returns', asyncHandler(async function (req, res) {
  const returnRequest = req.body;

  if (
    !returnRequest.productName ||
    returnRequest.price === undefined ||
    returnRequest.price === '' ||
    !returnRequest.reason ||
    !returnRequest.condition
  ) {
    return res.status(400).json({
      message: 'Missing required return request fields.',
      status: 'error'
    });
  }

  const numericId = generateNumericId();

  const newReturnRequest = {
    id: numericId,
    returnId: returnRequest.returnId || 'RET-' + numericId,
    productId: returnRequest.productId || 'N/A',
    productName: returnRequest.productName,
    price: Number(returnRequest.price || 0),
    reason: returnRequest.reason,
    condition: returnRequest.condition,
    notes: returnRequest.notes || 'N/A',
    status: 'Pending',
    submittedAt: new Date()
  };

  const savedReturnRequest = await ReturnRequest.create(newReturnRequest);

  res.status(201).json({
    message: 'Return request submitted successfully.',
    status: 'success',
    returnRequest: cleanDocument(savedReturnRequest)
  });
}));

app.patch('/api/returns/:id/status', asyncHandler(async function (req, res) {
  const returnId = Number(req.params.id);
  const newStatus = normalizeReturnStatus(req.body.status);

  if (!newStatus) {
    return res.status(400).json({
      message: 'Status must be Approved, Rejected, or Pending.',
      status: 'error'
    });
  }

  const returnRequest = await ReturnRequest.findOneAndUpdate(
    { id: returnId },
    {
      status: newStatus,
      reviewedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  if (!returnRequest) {
    return res.status(404).json({
      message: 'Return request not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Return request status updated successfully.',
    status: 'success',
    returnRequest: cleanDocument(returnRequest)
  });
}));

app.delete('/api/returns/:id', asyncHandler(async function (req, res) {
  const returnId = Number(req.params.id);

  const deletedReturnRequest = await ReturnRequest.findOneAndDelete({ id: returnId });

  if (!deletedReturnRequest) {
    return res.status(404).json({
      message: 'Return request not found.',
      status: 'error'
    });
  }

  res.json({
    message: 'Return request deleted successfully.',
    status: 'success'
  });
}));

// -------------------------
// FINALIZATIONS API
// -------------------------

app.get('/api/finalizations', asyncHandler(async function (req, res) {
  const finalizations = await Finalization.find().sort({ submittedAt: -1 });
  res.json(finalizations.map(cleanDocument));
}));

app.post('/api/finalizations', asyncHandler(async function (req, res) {
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

  const numericId = generateNumericId();

  const newFinalization = {
    id: numericId,
    finalizationId: finalization.finalizationId || 'FINAL-' + numericId,
    attendeeId: finalization.attendeeId || 'N/A',
    fullName: finalization.fullName,
    email: finalization.email,
    participationType: finalization.participationType,
    preferredSessionType: finalization.preferredSessionType,
    selectedSessions: finalization.selectedSessions,
    mealPreference: finalization.mealPreference || 'N/A',
    finalNotes: finalization.finalNotes || 'N/A',
    confirmedAttendance: Boolean(finalization.confirmedAttendance),
    submittedAt: new Date()
  };

  const savedFinalization = await Finalization.create(newFinalization);

  res.status(201).json({
    message: 'Finalization submitted successfully.',
    status: 'success',
    finalization: cleanDocument(savedFinalization)
  });
}));

// -------------------------
// DEFAULT HOMEPAGE REDIRECT
// -------------------------

app.get('/', function (req, res) {
  res.redirect('/html/index.html');
});

// -------------------------
// ERROR HANDLER
// -------------------------

app.use(function (error, req, res, next) {
  console.error(error);

  res.status(500).json({
    message: 'Server error.',
    status: 'error',
    details: error.message
  });
});

// -------------------------
// SERVER START
// -------------------------

async function startServer() {
  await connectToDatabase();
  await seedDatabase();

  app.listen(PORT, function () {
    console.log('TechConnect 2026 API running at http://localhost:' + PORT);
    console.log('Open homepage at http://localhost:' + PORT + '/html/index.html');
    console.log('Health check: http://localhost:' + PORT + '/api/health');
  });
}

startServer();