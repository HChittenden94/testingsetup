document.addEventListener('DOMContentLoaded', loadFeedback);

// Handle feedback form submission
document.querySelector('.feedback-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const feedbackText = document.querySelector('#feedback-text').value.trim();
    if (!feedbackText) {
        alert('Please enter some feedback before submitting.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/submit-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_text: feedbackText })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        console.log('Feedback submitted successfully');
        document.querySelector('#feedback-text').value = '';
        document.querySelector('.confirmation-message').style.display = 'block';

        loadFeedback(); // Refresh feedback list
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback.');
    }
});

// Function to check if user is a manager
function checkSession() {
    return localStorage.getItem('role') === 'manager';
}

// Fetch and display feedback
async function loadFeedback() {
    const isManager = localStorage.getItem('role') === 'manager';

    try {
        const response = await fetch('http://localhost:3000/get-feedback');
        const feedbackList = await response.json();
        const feedbackSection = document.querySelector('.feedback-display-section');
        feedbackSection.innerHTML = '<h2>Feedback from Employees</h2>';

        feedbackList.forEach(feedback => {
            const feedbackPost = document.createElement('div');

            const feedbackTimestamp = new Date(feedback.created_at);
            const formattedFeedbackTimestamp = feedbackTimestamp.toLocaleString(); // Format timestamp

            feedbackPost.classList.add('feedback-post');
            feedbackPost.dataset.id = feedback.feedback_id; // Store feedback ID

            feedbackPost.innerHTML = `
            <div class="feedback-header">
                <p>${feedback.feedback_text}</p>
            </div>

            <!-- Footer with Upvote/Downvote Buttons and Timestamp -->
            <div class="feedback-footer">
                <div class="feedback-actions">
                    <button class="upvote" data-id="${feedback.feedback_id}">👍 ${feedback.upvotes || 0}</button>
                    <button class="downvote" data-id="${feedback.feedback_id}">👎 ${feedback.downvotes || 0}</button>
                </div>
                <span class="timestamp">${formattedFeedbackTimestamp}</span> <!-- Moved timestamp here -->
            </div>
                <!-- Comment Section -->
                <div class="comment-section">
                    <input type="text" class="comment-input" placeholder="Add a comment...">
                    <button class="comment-button" data-id="${feedback.feedback_id}">Post</button>
                    <div class="comment-container"></div>
                </div>

                <!-- Acknowledgment Checkbox (Managers Only) -->
                ${isManager ? `
                    <label>
                        <input type="checkbox" class="mark-read" data-id="${feedback.feedback_id}" ${feedback.manager_acknowledged ? 'checked' : ''}>
                        Mark as Acknowledged
                    </label>
                ` : feedback.manager_acknowledged ? '<p style="color: green; font-weight: bold;">✅ Acknowledged by Manager</p>' : ''}
            `;

            feedbackSection.appendChild(feedbackPost);

            // Load the comments for each feedback post
            loadComments(feedback.feedback_id); // Load comments when feedback is loaded

        });

        // Add event listeners for upvote/downvote buttons
        document.querySelectorAll('.upvote').forEach(button => {
            button.addEventListener('click', function () {
                voteFeedback(this.dataset.id, 1);
            });
        });

        document.querySelectorAll('.downvote').forEach(button => {
            button.addEventListener('click', function () {
                voteFeedback(this.dataset.id, -1);
            });
        });

        // Add event listeners for comments
        document.querySelectorAll('.comment-button').forEach(button => {
            button.addEventListener('click', function () {
                const feedbackId = this.dataset.id;
                const commentInput = this.previousElementSibling;
                const commentText = commentInput.value.trim();

                if (commentText) {
                    postComment(feedbackId, commentText);
                    commentInput.value = ''; // Clear input
                }
            });
        });

        // Add event listeners for manager acknowledgment
        if (isManager) {
            document.querySelectorAll('.mark-read').forEach(checkbox => {
                checkbox.addEventListener('change', async function () {
                    const feedbackId = this.dataset.id || this.closest('.feedback-post').dataset.id;
                    if (!feedbackId) {
                        console.error("Feedback ID is missing!");
                        return;
                    }

                    const isChecked = this.checked ? 1 : 0;
                    console.log(`Sending acknowledgment update for feedback_id: ${feedbackId}, status: ${isChecked}`);

                    await markFeedbackAsRead(feedbackId, isChecked);
                });
            });
        }

    } catch (error) {
        console.error('Error fetching feedback:', error);
    }
}


// Mark feedback as acknowledged
async function markFeedbackAsRead(feedbackId, acknowledged) {
    try {
        const response = await fetch('http://localhost:3000/mark-feedback-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_id: feedbackId, acknowledged })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        console.log(`Feedback ID ${feedbackId} marked as ${acknowledged ? 'acknowledged' : 'unacknowledged'}`);
    } catch (error) {
        console.error('Error updating acknowledgment:', error);
    }
}

// Upvote and Downvote
async function voteFeedback(feedbackId, vote) {
    try {
        const response = await fetch('http://localhost:3000/vote-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_id: feedbackId, vote })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        console.log(`Feedback ID ${feedbackId} voted with ${vote > 0 ? 'upvote' : 'downvote'}`);
        loadFeedback(); // Refresh feedback to show updated vote counts
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('Error submitting vote.');
    }
}

// Function to submit a comment
async function postComment(feedbackId, commentText) {
    try {
        const response = await fetch('http://localhost:3000/submit-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_id: feedbackId, comment: commentText })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        console.log('Comment submitted successfully');
        loadComments(feedbackId); // Reload comments
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error submitting comment.');
    }
}

// Fetch and display comments
async function loadComments(feedbackId) {
    const isManager = localStorage.getItem('role') === 'manager'; // Check if the user is a manager

    try {
        const response = await fetch(`http://localhost:3000/get-comments?feedback_id=${feedbackId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const comments = await response.json();
        console.log(`Comments for feedback ${feedbackId}:`, comments);

        const feedbackPost = document.querySelector(`.feedback-post[data-id='${feedbackId}']`);
        if (!feedbackPost) return;

        const commentContainer = feedbackPost.querySelector('.comment-container');
        commentContainer.innerHTML = ''; // Clear existing comments

        // Only add the "Comments" header if there are comments
        if (comments.length > 0) {
            const commentsHeader = document.createElement('h2');
            commentsHeader.textContent = 'Comments';
            commentContainer.appendChild(commentsHeader); // Append header directly to container
        }

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment'); // Add a class for styling each comment

            // Format the timestamp
            const commentTimestamp = new Date(comment.created_at);
            const formattedCommentTimestamp = commentTimestamp.toLocaleString([], {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            commentElement.innerHTML = `
                <p class="comment-text">${comment.comment_text}</p>
                <small class="comment-timestamp">${formattedCommentTimestamp}</small>
            `;

            // If the user is a manager, add the delete button
            if (isManager) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-comment');
                deleteButton.style.marginTop = '5px'; 
                deleteButton.addEventListener('click', () => deleteComment(comment.id, feedbackId)); // Use comment.id

                commentElement.appendChild(deleteButton);
            }

            commentContainer.appendChild(commentElement); // Add the comment to the container

        });

    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}





//Delete Comment (MANAGER ONLY)
async function deleteComment(commentId, feedbackId) {
    const confirmation = confirm("Are you sure you want to delete this comment?");

    if (!confirmation) return; // Exit if user cancels

    try {
        const response = await fetch('http://localhost:3000/delete-comment', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: commentId })
        });

        alert('Comment successfully deleted.');
        console.log(`Comment with ID ${commentId} deleted successfully.`);
        
        // Reload comments after deleting to reflect changes
        loadComments(feedbackId); 
        }

    catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment.');
    }
}
