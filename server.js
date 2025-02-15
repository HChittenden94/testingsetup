const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS


const app = express();
const port = 3000;

const bcrypt = require('bcrypt');

app.use(cors()); // Enable CORS for all requests

app.use(bodyParser.json());

// Database connection setup
const db = mysql.createConnection({
    host: '107.180.1.16',
    user: 'cis440springA2025team10',
    password: 'cis440springA2025team10',
    database: 'cis440springA2025team10'
});

//Provide error if database connection fails
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database');
});

//Fetch feedback from database
app.get('/get-feedback', (req, res) => {
    const sql = 'SELECT * FROM feedback ORDER BY created_at DESC'; // Fetch in order

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

//Manager Login - Check credentials
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM managers WHERE name = ?', [username], (err, results) => {
        if (err || results.length === 0 || results[0].password !== password) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, role: 'manager' });
    });
});

// Acknowledge feedback
app.post('/mark-feedback-read', (req, res) => {
    console.log("Received request at /mark-feedback-read"); // Debugging log

    const { feedback_id, acknowledged } = req.body;
    console.log("Received Data:", req.body); // Log received data

    if (!feedback_id) {
        return res.status(400).json({ error: 'Feedback ID is required' });
    }

    const query = 'UPDATE feedback SET manager_acknowledged = ? WHERE feedback_id = ?';

    db.query(query, [acknowledged ? 1 : 0, feedback_id], (err, result) => {
        if (err) {
            console.error('Error updating acknowledgment:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        console.log(`Feedback ID ${feedback_id} marked as ${acknowledged ? 'acknowledged' : 'unacknowledged'}`);
        res.json({ success: true, message: `Acknowledgment updated for feedback ID ${feedback_id}` });
    });
});


// API endpoint to handle feedback submission
app.post('/submit-feedback', (req, res) => {
    console.log('Received data:', req.body); // Log request data
    const { feedback_text } = req.body;

    if (!feedback_text) {
        console.error('Feedback text is missing.');
        return res.status(400).json({ error: 'Feedback text is required' });
    }

    const query = 'INSERT INTO feedback (feedback_text) VALUES (?)';

    db.query(query, [feedback_text], (err, result) => {
        if (err) {
            console.error('Error inserting feedback:', err); // Log full MySQL error
            return res.status(500).json({ error: err.sqlMessage || 'Error submitting feedback' });
        }
        console.log('Feedback inserted successfully:', result);
        res.json({ message: 'Feedback submitted successfully' });
    });
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
