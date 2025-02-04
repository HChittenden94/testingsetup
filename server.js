const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database');
});

// API endpoint to handle feedback submission
app.post('/submit-feedback', (req, res) => {
    const { feedback } = req.body;
    if (!feedback) {
        return res.status(400).json({ error: 'Feedback is required' });
    }

    const query = 'INSERT INTO feedback (message) VALUES (?)';
    db.query(query, [feedback], (err, result) => {
        if (err) {
            console.error('Error inserting feedback:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, id: result.insertId });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
