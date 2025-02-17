document.getElementById('manager-login').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Login failed');

        // Save the manager role in localStorage
        localStorage.setItem('role', 'manager');

        console.log('Manager logged in successfully.');
        window.location.href = 'index.html';  // Redirect after login
    } catch (error) {
        alert('Invalid credentials');
    }
});
