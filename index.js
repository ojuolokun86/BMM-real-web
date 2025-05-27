import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from "./config.js";

console.log('API Base URL:', API_BASE_URL);
console.log('Socket Base URL:', createSocket());

// Connect to WebSocket
const socket = createSocket();
console.log('🔗 Connected to WebSocket server');

const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const buttonSection = document.getElementById('buttonSection');
const loginSection = document.getElementById('loginSection');
const loginForm = document.getElementById('loginForm');
const loginResponseMessage = document.getElementById('loginResponseMessage');
// Set current year dynamically
document.getElementById('year').textContent = new Date().getFullYear();

// Show the login form when "Login" is clicked
loginButton.addEventListener('click', () => {
    buttonSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// Redirect to the registration page when "Register" is clicked
registerButton.addEventListener('click', () => {
    window.location.href = 'register.html';
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log(`📧 Email: ${email}, 🔑 Password: ${password}`  );

    try {
        console.log('🔍 Form submitted'); // Debug log
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            // Store auth_id and role in local storage
            localStorage.setItem('auth_id', data.auth_id);
            localStorage.setItem('role', data.role);

            loginResponseMessage.textContent = '✅ Login successful!';
            loginResponseMessage.classList.add('success');

            // Redirect based on role
            if (data.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            loginResponseMessage.textContent = `❌ ${data.message}`;
            loginResponseMessage.classList.add('error');
        }
    } catch (error) {
        loginResponseMessage.textContent = '❌ Error logging in.';
        loginResponseMessage.classList.add('error');
    }
});