document.querySelector('.feedback-form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Prevent default form submission

    // Get the value of the feedback textarea
    const feedbackText = document.querySelector('#feedback-text').value.trim();

    // Only proceed if feedback is not empty
    if (feedbackText !== '') {
        try {
            // Send feedback to backend database
            const response = await fetch('http://localhost:3000/submit-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback_text: feedbackText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Success:', result);

            // Display the feedback on the page
            displayFeedback(feedbackText);

            // Show confirmation message
            document.querySelector('.confirmation-message').style.display = 'block';

            // Clear the textarea for new input
            document.querySelector('#feedback-text').value = '';

        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting feedback.');
        }
    } else {
        alert('Please enter some feedback before submitting.');
    }
});

// Function to display feedback on the page
function displayFeedback(feedbackText) {
    const feedbackSection = document.querySelector('.feedback-display-section');

    // Create a new feedback post element
    const newFeedback = document.createElement('div');
    newFeedback.classList.add('feedback-post');

    // Add feedback content, upvote/downvote buttons, and comment input to the new post
    newFeedback.innerHTML = `
        <p>${feedbackText}</p>
        <div class="feedback-actions">
            <button class="upvote">👍 0</button>
            <button class="downvote">👎 0</button>
        </div>
        <div class="comment-section">
            <input type="text" class="comment-input" placeholder="Add a comment...">
        </div>
    `;

    // Append the new feedback post to the feedback display section
    feedbackSection.appendChild(newFeedback);
}
