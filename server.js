
require("dotenv").config();

const express = require("express");
const path = require("path");
const { db, initializeDatabase } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Frontend files - all remain in the same folder
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "script.js"));
});

// Get tasks with search and filters
app.get("/api/tasks", async (req, res) => {
    try {
        const { search, status, priority, category } = req.query;

        let sql = "SELECT * FROM tasks WHERE 1=1";
        const values = [];

        if (search) {
            sql += " AND (title LIKE ? OR description LIKE ?)";
            values.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            sql += " AND status = ?";
            values.push(status);
        }

        if (priority) {
            sql += " AND priority = ?";
            values.push(priority);
        }

        if (category) {
            sql += " AND category = ?";
            values.push(category);
        }

        sql += `
            ORDER BY
            CASE WHEN status = 'Completed' THEN 1 ELSE 0 END,
            due_date IS NULL,
            due_date ASC,
            created_at DESC
        `;

        const [tasks] = await db.query(sql, values);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Could not load tasks." });
    }
});

// Dashboard statistics
app.get("/api/stats", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(status = 'Pending') AS pending,
                SUM(status = 'In Progress') AS inProgress,
                SUM(status = 'Completed') AS completed,
                SUM(
                    due_date < CURDATE()
                    AND status != 'Completed'
                ) AS overdue
            FROM tasks
        `);

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Could not load statistics." });
    }
});

// Add a task
app.post("/api/tasks", async (req, res) => {
    try {
        const {
            title,
            description,
            due_date,
            priority,
            category
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        const [result] = await db.query(
            `INSERT INTO tasks
            (title, description, due_date, priority, category)
            VALUES (?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description || "",
                due_date || null,
                priority || "Medium",
                category || "Personal"
            ]
        );

        res.status(201).json({
            message: "Task added successfully.",
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: "Could not add task." });
    }
});

// Edit a task
app.put("/api/tasks/:id", async (req, res) => {
    try {
        const {
            title,
            description,
            due_date,
            priority,
            category,
            status
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        const [result] = await db.query(
            `UPDATE tasks SET
                title = ?,
                description = ?,
                due_date = ?,
                priority = ?,
                category = ?,
                status = ?
             WHERE id = ?`,
            [
                title.trim(),
                description || "",
                due_date || null,
                priority,
                category,
                status,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.json({ message: "Task updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not update task." });
    }
});

// Update only task status
app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!["Pending", "In Progress", "Completed"].includes(status)) {
            return res.status(400).json({
                message: "Invalid task status."
            });
        }

        const [result] = await db.query(
            "UPDATE tasks SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.json({ message: "Status updated." });
    } catch (error) {
        res.status(500).json({ message: "Could not update status." });
    }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM tasks WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        res.json({ message: "Task deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not delete task." });
    }
});

// Start server after connecting to MySQL
async function startServer() {
    try {
        await db.query("SELECT 1");
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
