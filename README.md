# TechConnect 2026 Conference Event Organizer

This project is a conference event organizing website for IST 256. It includes frontend pages for conference registration, products, cart, finalization, and new Node.js backend support for proposal, billing, and returns workflows.

## Important Setup Note

The `node_modules` folder is intentionally **not included** in GitHub.

It should not be committed because it contains thousands of dependency files and can freeze Git or VS Code.

After cloning or pulling this branch, each person must run:

```bash
npm install
```

## REQUIRED SOFTWARE

* Make sure Node.js is installed.
    Check with:

    ```bash
    node -v
    npm -v
    ```

## First-Time Setup

* From the project root folder, run:
    
    ```bash
    npm install
    ```

This installs the backend dependencies:

```text
express
cors
```

## Running the Node.js server

* Start the backend server with:

    ```bash
    npm start
    ```
* If successful, the terminal should show:

```text
TechConnect 2026 API running at http://localhost:3000
Open homepage at http://localhost:3000/html/index.html
Health check: http://localhost:3000/api/health
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
http://localhost:3000/api/proposals
http://localhost:3000/api/billing
http://localhost:3000/api/returns
```

Expected results:

```text
/api/health should show a success message.
/api/proposals should show []
/api/billing should show []
/api/returns should show []
```

The empty arrays are normal before anything has been submitted.

## Available API Endpoints

### Health Check

```text
GET /api/health
```

Confirms the backend is running.

## Session Proposals

```text
GET /api/proposals
POST /api/proposals
PATCH /api/proposals/:id/status
```

Used for the session proposal submission and approval workflow.

Expected proposal JSON:

```json
{
  "title": "AI in Cybersecurity",
  "abstract": "A short description of the proposed session.",
  "speakerName": "Test Speaker",
  "speakerEmail": "speaker@example.com",
  "category": "Cybersecurity",
  "format": "Workshop",
  "notes": "Optional notes"
}
```

Status update JSON:

```json
{
  "status": "Approved"
}
```

Valid statuses:

```text
Pending
Approved
Rejected
```

## Billing Details

```text
GET /api/billing
POST /api/billing
```

Used for the Billing Details page.

Expected billing JSON:

```json
{
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

The backend stores only the last four digits of the card number.

## Returns

```text
GET /api/returns
POST /api/returns
PATCH /api/returns/:id/status
```

Used for the Returns page.

Expected return JSON:

```json
{
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

Valid statuses:

```text
Pending
Approved
Rejected
```

## Important Git Note

Do not commit `node_modules`.

The `.gitignore` file should include:

```text
node_modules/
.env
.DS_Store
```

Only commit these backend setup files:

```text
server.js
package.json
package-lock.json
.gitignore
README.md
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

Because the backend currently uses in-memory storage, restarting the server clears:

```text
proposals
billingDetails
returnRequests
```

So the API lists will reset back to empty arrays.

## Notes for Frontend Page Builders

Use relative API paths when calling the backend from pages served through Node:

```javascript
$http.post('/api/proposals', proposalData)
$http.get('/api/proposals')
$http.patch('/api/proposals/' + proposal.id + '/status', { status: 'Approved' })
```

For billing:

```javascript
$http.post('/api/billing', billingData)
```

For returns:

```javascript
$http.post('/api/returns', returnData)
```

Make sure the Node server is running before testing API calls.
