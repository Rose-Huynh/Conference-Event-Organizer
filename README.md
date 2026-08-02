# TechConnect 2026 Conference Event Organizer

This project is a conference event organizing website for IST 256. It includes frontend pages for conference registration, session management, products, shopping cart, billing, returns, proposal submission, proposal approval, and final registration finalization.

The project now uses a Node.js/Express backend connected to MongoDB Atlas through Mongoose for persistent database storage.

## Project Theme

Conference Event Organizing Website

Main data areas include:

```text
Products
Shopping cart
Shipping
Billing
Returns
Sessions
Attendees
Proposals
Finalizations
```

## Important Setup Note

The `node_modules` folder and `.env` file are intentionally **not included** in GitHub.

They should not be committed.

After cloning or pulling this branch, each person must run:

```bash
npm install
```

Each person also needs their own local `.env` file.

## Required Software

Make sure Node.js and npm are installed.

Check with:

```bash
node -v
npm -v
```

Recommended Node version:

```text
Node 20.19.0 or newer
```

## First-Time Setup

From the project root folder, run:

```bash
npm install
```

This installs the backend dependencies:

```text
express
cors
dotenv
mongoose
```

## Environment Setup

Create a file named `.env` in the project root.

Add the MongoDB Atlas connection string:

```env
MONGODB_URI=your_mongodb_atlas_connection_string_here
PORT=3000
```

Do not commit `.env`.

An example file named `.env.example` may be committed with placeholder values:

```env
MONGODB_URI=your_mongodb_atlas_connection_string_here
PORT=3000
```

## MongoDB Atlas Access

This project uses MongoDB Atlas as the hosted MongoDB database.

Members who need to run the project must have:

```text
1. The MongoDB connection string in their own local .env file
2. Their IP address allowed in MongoDB Atlas Network Access (Currently is set to allow all IP addresses for project convenience)
```

The `.env` file will be shared privately, not through GitHub.

## Project Structure

Recommended assignment structure:

```text
server.js
package.json
package-lock.json
.env
.env.example
.gitignore
README.md

public/
  html/
  css/
  js/
  data/
```

The Express server serves the frontend files from the `public` folder.

## Running the Node.js Server

Start the backend server with:

```bash
npm start
```

If successful, the terminal should show something like:

```text
Connected to MongoDB successfully.
products already has data. Skipping seed.
sessions already has data. Skipping seed.
attendees already has data. Skipping seed.
TechConnect 2026 API running at http://localhost:3000
Open homepage at http://localhost:3000/html/index.html
Health check: http://localhost:3000/api/health
```

On the first successful database run, it may show:

```text
Seeded 9 documents into products.
Seeded 5 documents into sessions.
Seeded 3 documents into attendees.
```

**Make sure to keep the terminal open while testing the site!**

## Opening the Website

Use the Node server instead of Live Server for backend testing:

```text
http://localhost:3000/html/index.html
```

The backend API runs on:

```text
http://localhost:3000
```

## Test the Backend

Open these URLs in a browser:

```text
http://localhost:3000/api/health
http://localhost:3000/api/products
http://localhost:3000/api/sessions
http://localhost:3000/api/attendees
http://localhost:3000/api/cart
http://localhost:3000/api/billing
http://localhost:3000/api/shipping
http://localhost:3000/api/returns
http://localhost:3000/api/proposals
http://localhost:3000/api/finalizations
```

Expected health result:

```json
{
  "message": "TechConnect 2026 Node.js API is running.",
  "status": "success",
  "database": "connected"
}
```

## Database Seeding

The project uses JSON files only as starter seed data.

These files are seeded into MongoDB only if their collections are empty:

```text
public/data/products.json
public/data/sessions.json
public/data/attendees.json
```

The application does not use temporary in-memory arrays for persistent data.

Products, sessions, and attendees are stored in MongoDB after seeding.

Cart, billing, shipping, returns, proposals, and finalizations are created from frontend form submissions.

## MongoDB Collections

The MongoDB database is named:

```text
techconnect2026
```

The collections include:

```text
products
shoppingCart
shipping
billing
returns
sessions
attendees
proposals
finalizations
```

## Available API Endpoints

### Health Check

```text
GET /api/health
```

Confirms the backend is running and connected to MongoDB.

## Products

```text
GET /api/products
POST /api/products
PUT /api/products/:productId
DELETE /api/products/:productId
```

Used for the Products page and Cart page.

Expected product JSON:

```json
{
  "productId": "P110",
  "name": "Conference Notebook",
  "description": "Notebook for conference attendees.",
  "category": "Merchandise",
  "unitOfMeasure": "Each",
  "price": "6.99",
  "additionalInfo": "TechConnect 2026 branded notebook"
}
```

## Sessions

```text
GET /api/sessions
POST /api/sessions
PUT /api/sessions/:sessionId
DELETE /api/sessions/:sessionId
```

Used for the Sessions page and Finalization page.

Expected session JSON:

```json
{
  "sessionId": "S106",
  "title": "Cloud Security Basics",
  "type": "Workshop",
  "format": "Workshop Block",
  "price": "0.00",
  "description": "Introductory cloud security session.",
  "additionalInfo": "Room B, 2:00 PM"
}
```

## Attendees

```text
GET /api/attendees
POST /api/attendees
PUT /api/attendees/:id
DELETE /api/attendees/:id
```

Used for the Signup page and Finalization page.

Expected attendee JSON:

```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phone": "1234567890",
  "age": 24,
  "affiliation": "Penn State Student"
}
```

## Shopping Cart

```text
GET /api/cart
POST /api/cart
PUT /api/cart/:id
DELETE /api/cart/:id
```

Used for the Cart page.

Expected cart JSON:

```json
{
  "cartId": "TC-CART-123456789",
  "event": "TechConnect 2026",
  "items": [
    {
      "productId": "P101",
      "name": "Conference Badge w/Printed Name",
      "quantity": 1,
      "price": "2.50"
    }
  ],
  "total": 2.50
}
```

## Billing Details

```text
GET /api/billing
POST /api/billing
DELETE /api/billing/:id
```

Used for the Billing page.

Expected billing JSON:

```json
{
  "billingId": "BILL-123456789",
  "fullName": "Test User",
  "address": "123 Test Street",
  "city": "State College",
  "state": "PA",
  "zipCode": "16801",
  "cardNumber": "4111111111111111",
  "expirationDate": "12/28",
  "securityCode": "123",
  "orderSummary": [],
  "totalAmount": 0,
  "shippingDetails": "Standard Shipping"
}
```

Do not use real credit card information. Use fake test data only.

The backend stores only the last four digits of the card number. It does not store the full card number or security code.

Submitting billing information also creates a related shipping document in MongoDB.

## Shipping

```text
GET /api/shipping
POST /api/shipping
PUT /api/shipping/:id
DELETE /api/shipping/:id
```

Shipping records are created automatically when billing details are submitted.

Expected shipping JSON:

```json
{
  "fullName": "Test User",
  "address": "123 Test Street",
  "city": "State College",
  "state": "PA",
  "zipCode": "16801",
  "shippingMethod": "Standard Shipping"
}
```

## Returns

```text
GET /api/returns
POST /api/returns
PATCH /api/returns/:id/status
DELETE /api/returns/:id
```

Used for the Returns page.

Expected return JSON:

```json
{
  "returnId": "RET-123456789",
  "productId": "P109",
  "productName": "Conference Lanyard",
  "price": "3.25",
  "reason": "Changed my mind",
  "condition": "Unopened",
  "notes": "Optional notes"
}
```

Status update JSON:

```json
{
  "status": "Approved"
}
```

Valid return statuses:

```text
Pending
Approved
Rejected
```

## Session Proposals

```text
GET /api/proposals
POST /api/proposals
PATCH /api/proposals/:id/status
```

Used for the Proposal and Approval pages.

Expected proposal JSON:

```json
{
  "title": "AI in Cybersecurity",
  "abstract": "A longer description of the proposed session for reviewers.",
  "speakerName": "Test Speaker",
  "speakerEmail": "speaker@example.com",
  "category": "Cybersecurity",
  "format": "Workshop",
  "durationMinutes": 30,
  "notes": "Optional notes",
  "status": "pending"
}
```

Status update JSON:

```json
{
  "status": "approved"
}
```

Valid proposal statuses:

```text
pending
approved
rejected
```

## Finalizations

```text
GET /api/finalizations
POST /api/finalizations
```

Used for the Finalization page.

Expected finalization JSON:

```json
{
  "finalizationId": "FIN-123456789",
  "attendeeId": "2001",
  "fullName": "Test User",
  "email": "test@example.com",
  "participationType": "Attendee",
  "preferredSessionType": "Workshop",
  "selectedSessions": [
    {
      "sessionId": "S102",
      "title": "Web Development Trends",
      "type": "Workshop",
      "format": "Workshop Block"
    }
  ],
  "mealPreference": "None",
  "finalNotes": "Optional notes",
  "confirmedAttendance": true
}
```

## Frontend Integration

The frontend pages use JavaScript, jQuery/AJAX, React, AngularJS, and fetch requests to communicate with the Express backend.

Examples:

```javascript
fetch('/api/attendees')
fetch('/api/attendees', { method: 'POST' })

$.getJSON('/api/products')
$.ajax({ url: '/api/products', method: 'POST' })

$http.get('/api/sessions')
$http.post('/api/finalizations', finalizationDocument)

fetch('http://localhost:3000/api/proposals')
```

Make sure the Node server is running before testing API calls.

## Important Git Note

Do not commit:

```text
node_modules/
.env
```

The `.gitignore` file should include:

```text
node_modules/
.env
.DS_Store
```

Commit these project files:

```text
server.js
package.json
package-lock.json
.gitignore
README.md
.env.example
public/html/
public/css/
public/js/
public/data/
```

## Resetting the Server

To stop the server, press:

```text
Ctrl + C
```

Then restart it with:

```bash
npm start
```

Because the backend now uses MongoDB, restarting the server does **not** clear submitted data.

Products, sessions, attendees, carts, billing records, shipping records, returns, proposals, and finalizations persist in MongoDB Atlas.

## Assignment Screenshot Checklist

Include screenshots of:

```text
Node.js terminal showing successful MongoDB connection
Browser showing /api/health with database connected
MongoDB Atlas showing collections
MongoDB Atlas showing inserted documents
server.js showing Mongoose connection setup
server.js showing schemas/models
server.js showing CRUD routes
Frontend pages interacting with the backend
Frontend JavaScript showing AJAX/fetch/AngularJS/React API calls
```

Required MongoDB collections to show:

```text
products
shoppingCart
shipping
billing
returns
```

Additional theme collections to show:

```text
sessions
attendees
proposals
finalizations
```