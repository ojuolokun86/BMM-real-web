import { API_BASE_URL } from './config.js';

const registerForm = document.getElementById('registerForm');
const registerResponseMessage = document.getElementById('registerResponseMessage');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('🔍 Form submitted'); // Debug log
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

     console.log(`📧 Email: ${email}, 🔑 Password: ${password}, 🔑 Confirm Password: ${confirmPassword}`); // Debug log


    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, confirmPassword }),
        });

        const data = await response.json();
         console.log('📥 Response from server:', data); // Debug log

        if (response.ok) {
            const authId = data.auth_id; // Retrieve the generated auth_id
            localStorage.setItem('auth_id', authId); // Store auth_id in local storage
            registerResponseMessage.textContent = `✅ Registration successful! Your Auth ID: ${authId}`;
            registerResponseMessage.classList.add('success');
            // Redirect to the dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000); // Add a slight delay for user feedback
        } else {
            registerResponseMessage.textContent = `❌ ${data.message}`;
            registerResponseMessage.classList.add('error');
        }
    } catch (error) {
        registerResponseMessage.textContent = '❌ Error registering user.';
        registerResponseMessage.classList.add('error');
    }
});