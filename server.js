require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

// API guide
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>IT Support Desk API</title>
        </head>
        <body>
            <h1>IT Support Desk API</h1>

            <p>Student Number: 202512212</p>
            <p>Description: Backend API for managing IT support requests.</p>

            <h2>API Links</h2>
            <p><a href="/health">Health Check</a></p>
            <p><a href="/api/records">View All Records</a></p>

            <h2>Available Routes</h2>
            <table border="1" cellpadding="8">
                <tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr>
                <tr><td>GET</td><td>/api/records</td><td>Get all records</td></tr>
                <tr><td>GET</td><td>/api/records/:id</td><td>Get one record</td></tr>
                <tr><td>POST</td><td>/api/records</td><td>Create a record</td></tr>
                <tr><td>PUT</td><td>/api/records/:id</td><td>Update a record</td></tr>
                <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr>
            </table>

            <h2>Required Fields</h2>
            <p>title, category, description, status</p>
            <p>Allowed statuses: Pending, In progress, Completed</p>

            <h2>Example POST/PUT JSON</h2>
            <pre>
{
    "title": "Computer not starting",
    "category": "Hardware",
    "description": "The office computer will not start.",
    "status": "Pending"
}
            </pre>

            <h2>Response Codes</h2>
            <p>200: Successful request</p>
            <p>201: Record created</p>
            <p>400: Invalid input</p>
            <p>404: Record or route not found</p>
            <p>500: Server error</p>

            <p>Note: The service may be idle when not in use.</p>
        </body>
        </html>
    `);
});

// Database health check
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({ status: "OK", database: "Connected" });
    } catch (error) {
        res.status(503).json({
            status: "Unavailable",
            database: "Not connected"
        });
    }
});

// Record routes
app.use("/api/records", require("./routes/records"));

// Unknown routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

// Error handler
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ message: "Malformed JSON." });
    }

    console.error(error);
    res.status(500).json({ message: "Internal server error." });
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
});