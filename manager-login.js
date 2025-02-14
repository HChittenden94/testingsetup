document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('#manager-login');

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent page refresh

        const username = document.querySelector('#username').value.trim();
        const password = document.querySelector('#password').value.trim();

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                alert('Login successful!');
                sessionStorage.setItem('isManager', 'true'); // Store authentication state
                window.location.href = 'index.html'; // Redirect to the main page
            } else {
                alert('Invalid username or password.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error logging in.');
        }
    });
});
