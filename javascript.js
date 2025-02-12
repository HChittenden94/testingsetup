document.addEventListener('DOMContentLoaded', loadFeedback); // Load feedback when page loads

// Handle feedback form submission
document.querySelector('.feedback-form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Prevent default form submission

    const feedbackText = document.querySelector('#feedback-text').value.trim();
    if (!feedbackText) {
        alert('Please enter some feedback before submitting.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/submit-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_text: feedbackText }) // Matches database column
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        console.log('Feedback submitted successfully');
        document.querySelector('#feedback-text').value = ''; // Clear textarea
        document.querySelector('.confirmation-message').style.display = 'block'; // Show confirmation

        loadFeedback(); // Refresh feedback list
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback.');
    }
});

// Fetch and display feedback and comments from database
async function loadFeedback() {
    try {
        const response = await fetch('http://localhost:3000/get-feedback');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const feedbackList = await response.json();
        console.log('Feedback received:', feedbackList);

        const feedbackSection = document.querySelector('.feedback-display-section');
        feedbackSection.innerHTML = '<h2>Feedback from Employees</h2>';

        feedbackList.forEach(feedback => {
            const feedbackPost = document.createElement('div');
            const feedbackTimestamp = new Date(feedback.created_at);
            const formattedFeedbackTimestamp = feedbackTimestamp.toLocaleString(); // Format as 'MM/DD/YYYY, HH:MM AM/PM'
            feedbackPost.classList.add('feedback-post');
            feedbackPost.setAttribute('data-id', feedback.id);

            feedbackPost.innerHTML = `
                <div class="feedback-header">
                    <p>${feedback.feedback_text}</p>
                    <p><small class="timestamp">${formattedFeedbackTimestamp}</small></p> <!-- Timestamp at top-right -->
                </div>
                <div class="feedback-actions">
                    <button class="upvote">👍 0</button>
                    <button class="downvote">👎 0</button>
                </div>
                <div class="comment-section">
                    <input type="text" class="comment-input" placeholder="Add a comment...">
                    <button class="submit-comment" data-id="${feedback.id}">Post</button>
                </div>
            `;


            feedbackSection.appendChild(feedbackPost);

            // Load comments for this feedback
            loadComments(feedback.id);
        });

        // Event listener for submitting comments
        document.querySelectorAll('.submit-comment').forEach(button => {
            button.addEventListener('click', function () {
                const feedbackId = this.getAttribute('data-id');
                const commentInput = this.previousElementSibling;
                const commentText = commentInput.value.trim();

                if (commentText) {
                    postComment(feedbackId, commentText);
                    commentInput.value = ''; // Clear input after submission
                }
            });
        });

    } catch (error) {
        console.error('Error fetching feedback:', error);
    }
}

// Load feedback on page load
document.addEventListener('DOMContentLoaded', loadFeedback);

// Function to submit a comment
async function postComment(feedbackId, commentText) {
    try {
        const response = await fetch('http://localhost:3000/submit-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_id: feedbackId, comment: commentText })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result = await response.json();
        console.log('Comment submitted:', result);

        // Refresh comments for this feedback
        loadComments(feedbackId);
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error submitting comment.');
    }
}

// Function to fetch and display comments under each feedback
async function loadComments(feedbackId) {
    try {
        const response = await fetch(`http://localhost:3000/get-comments?feedback_id=${feedbackId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const comments = await response.json();
        console.log(`Comments for feedback ${feedbackId}:`, comments);

        // Find the feedback post container
        const feedbackPost = document.querySelector(`.feedback-post[data-id='${feedbackId}']`);
        if (!feedbackPost) return;

        const commentSection = feedbackPost.querySelector('.comment-section');
        commentSection.innerHTML = `<input type="text" class="comment-input" placeholder="Add a comment...">
                                    <button class="submit-comment" data-id="${feedbackId}">Post</button>`;

        const commentTimestamp = new Date(comment.created_at);
        const formattedCommentTimestamp = commentTimestamp.toLocaleString(); // Format as 'MM/DD/YYYY, HH:MM AM/PM'

        commentElement.innerHTML = `
            <p>${comment.comment}</p>
            <p><small class="timestamp">${formattedCommentTimestamp}</small></p> <!-- Timestamp at top-right -->
        `;

        // Append comments in chronological order
        comments.forEach(comment => {
            const commentElement = document.createElement('p');
            commentElement.textContent = comment.comment;
            commentSection.appendChild(commentElement);
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}