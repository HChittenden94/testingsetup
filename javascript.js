async function postFeedback(userInput) {
            try {
                const response = await fetch('http://localhost:3000/submit-feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback: userInput })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Success:', result);
                alert('Feedback submitted successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('Error submitting feedback.');
            }
        }

        function submitFeedback() {
            const userInput = document.getElementById('feedbackInput').value;
            if (userInput.trim()) {
                postFeedback(userInput);
            } else {
                alert('Please enter some feedback before submitting.');
            }
        }