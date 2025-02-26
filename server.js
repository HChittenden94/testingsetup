const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

const bcrypt = require('bcrypt');

app.use(cors()); // Enable CORS for all requests
app.use(bodyParser.json());
app.use(express.static('public'));

// Create a pool instead of a single connection
const pool = mysql.createPool({
    host: '107.180.1.16',
    user: 'cis440springA2025team10',
    password: 'cis440springA2025team10',
    database: 'cis440springA2025team10',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Provide error if database connection fails
(async () => {
    try {
        const [results] = await pool.query('SELECT 1');
        console.log('Database connected:', results);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

// Fetch feedback from database
app.get('/get-feedback', async (req, res) => {
    const sql = 'SELECT * FROM feedback ORDER BY upvotes DESC, downvotes ASC'; // Fetch in order

    try {
        const [results] = await pool.query(sql);
        res.json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Manager Login - Check credentials
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [results] = await pool.query('SELECT * FROM managers WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const user = results[0];

        if (user.password === password) {
            res.json({ success: true, role: 'manager' });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Acknowledge feedback
app.post('/mark-feedback-read', async (req, res) => {
    console.log("Received request at /mark-feedback-read"); // Debugging log

    const { feedback_id, acknowledged } = req.body;
    console.log("Received Data:", req.body); // Log received data

    if (!feedback_id) {
        return res.status(400).json({ error: 'Feedback ID is required' });
    }

    const query = 'UPDATE feedback SET manager_acknowledged = ? WHERE feedback_id = ?';

    try {
        const [result] = await pool.query(query, [acknowledged ? 1 : 0, feedback_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        console.log(`Feedback ID ${feedback_id} marked as ${acknowledged ? 'acknowledged' : 'unacknowledged'}`);
        res.json({ success: true, message: `Acknowledgment updated for feedback ID ${feedback_id}` });
    } catch (err) {
        console.error('Error updating acknowledgment:', err);
        res.status(500).json({ error: 'Database update failed' });
    }
});

// API endpoint to handle feedback submission
app.post('/submit-feedback', async (req, res) => {
    console.log('Received data:', req.body); // Log request data
    const { feedback_text } = req.body;

    if (!feedback_text) {
        console.error('Feedback text is missing.');
        return res.status(400).json({ error: 'Feedback text is required' });
    }

    const query = 'INSERT INTO feedback (feedback_text) VALUES (?)';

    try {
        const [result] = await pool.query(query, [feedback_text]);
        console.log('Feedback inserted successfully:', result);
        res.json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        console.error('Error inserting feedback:', err); // Log full MySQL error
        res.status(500).json({ error: err.sqlMessage || 'Error submitting feedback' });
    }
});

// Send Upvotes and Downvotes to database
app.post('/vote-feedback', async (req, res) => {
    const { feedback_id, vote } = req.body; // vote = 1 for upvote, -1 for downvote

    if (!feedback_id || ![1, -1].includes(vote)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    try {
        if (vote === 1) {
            await pool.query('UPDATE feedback SET upvotes = upvotes + 1 WHERE feedback_id = ?', [feedback_id]);
        } else if (vote === -1) {
            await pool.query('UPDATE feedback SET downvotes = downvotes + 1 WHERE feedback_id = ?', [feedback_id]);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to handle comment submission
app.post('/submit-comment', async (req, res) => {
    console.log('Received comment data:', req.body); // Log request data
    const { feedback_id, comment } = req.body;

    if (!feedback_id || !comment) {
        console.error('Missing feedback_id or comment.');
        return res.status(400).json({ error: 'Feedback ID and comment text are required' });
    }

    const query = 'INSERT INTO comments (feedback_id, comment_text) VALUES (?, ?)';

    try {
        const [result] = await pool.query(query, [feedback_id, comment]);
        console.log('Comment inserted successfully:', result);
        res.json({ message: 'Comment submitted successfully' });
    } catch (err) {
        console.error('Error inserting comment:', err);
        res.status(500).json({ error: err.sqlMessage || 'Error submitting comment' });
    }
});


// Fetch comments for a specific feedback
app.get('/get-comments', async (req, res) => {
    const { feedback_id } = req.query;
    if (!feedback_id) {
        return res.status(400).json({ error: 'Feedback ID is required' });
    }

    const query = 'SELECT * FROM comments WHERE feedback_id = ? ORDER BY created_at ASC';

    try {
        const [comments] = await pool.query(query, [feedback_id]);
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});


// DELETE route for deleting a comment (MANAGER ONLY)
app.delete('/delete-comment', async (req, res) => {
    const { id } = req.body; // Use "id" as the key to match the column name in the database

    try {
        const result = await pool.query('DELETE FROM comments WHERE id = ?', [id]); // Correct column name here
        
        if (result.affectedRows > 0) {
            res.status(200).send('Comment deleted successfully.');
        } else {
            res.status(404).send('Comment not found.');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).send('Error deleting comment.');
    }
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
