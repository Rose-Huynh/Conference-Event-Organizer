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
    * Check with:
    ```bash
    node -v
    npm -v
    ```

## First-Time Setup

* From the project root folder, run:
    ```bash
    npm install
    ```
    * This installs the backend dependencies (express, cors)

## Running the Node.js server

* Start the backend server with:
    ```bash
    npm start
    ```
* If successful, the terminal should show:
    ```yaml
    TechConnect 2026 API running at http://localhost:3000
    Open homepage at http://localhost:3000/html/index.html
    Health check: http://localhost:3000/api/health
    ```
    **Make sure to keep the terminal open while testing the site!**