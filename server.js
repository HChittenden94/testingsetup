const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all requests

// Database connection setup
const db = mysql.createConnection({
    host: '107.180.1.16',
    user: 'cis440springA2025team10',
    password: 'cis440springA2025team10',
    database: 'cis440springA2025team10'
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
