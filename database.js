
const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "todo1_db",
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

async function initializeDatabase() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT,
            due_date DATE,
            priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
            category VARCHAR(50) DEFAULT 'Personal',
            status ENUM('Pending', 'In Progress', 'Completed')
                DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

module.exports = { db, initializeDatabase };
