const express = require("express");
const pool = require("../db");

const router = express.Router();

const validStatuses = ["Pending", "In progress", "Completed"];

function validateRecord(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "A valid JSON object is required.";
    }

    const { title, category, description, status } = body;

    if (
        typeof title !== "string" ||
        typeof category !== "string" ||
        typeof description !== "string" ||
        typeof status !== "string"
    ) {
        return "All four fields must be provided as text.";
    }

    if (title.trim().length < 3 || title.trim().length > 80) {
        return "Title must be between 3 and 80 characters.";
    }

    if (category.trim().length < 2 || category.trim().length > 40) {
        return "Category must be between 2 and 40 characters.";
    }

    if (description.trim().length < 5 || description.trim().length > 300) {
        return "Description must be between 5 and 300 characters.";
    }

    if (!validStatuses.includes(status.trim())) {
        return "Status must be Pending, In progress, or Completed.";
    }

    return null;
}

function validId(id) {
    return /^[1-9]\d*$/.test(id);
}

// GET all records
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT * FROM records ORDER BY id"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// GET one record
router.get("/:id", async (req, res, next) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ message: "Invalid record ID." });
        }

        const result = await pool.query(
            "SELECT * FROM records WHERE id = $1",
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST create a record
router.post("/", async (req, res, next) => {
    try {
        const errorMessage = validateRecord(req.body);

        if (errorMessage) {
            return res.status(400).json({ message: errorMessage });
        }

        const { title, category, description, status } = req.body;

        const result = await pool.query(
            `INSERT INTO records (title, category, description, status)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [title.trim(), category.trim(), description.trim(), status.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT update a record
router.put("/:id", async (req, res, next) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ message: "Invalid record ID." });
        }

        const errorMessage = validateRecord(req.body);

        if (errorMessage) {
            return res.status(400).json({ message: errorMessage });
        }

        const { title, category, description, status } = req.body;

        const result = await pool.query(
            `UPDATE records
             SET title = $1, category = $2, description = $3, status = $4
             WHERE id = $5 RETURNING *`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                status.trim(),
                req.params.id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE a record
router.delete("/:id", async (req, res, next) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ message: "Invalid record ID." });
        }

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json({ message: "Record deleted." });
    } catch (error) {
        next(error);
    }
});
module.exports = router;
