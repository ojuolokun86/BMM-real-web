import { API_BASE_URL } from "./config.js";

const form = document.getElementById('forgotPasswordForm');
const responseMsg = document.getElementById('resetResponseMessage');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        responseMsg.textContent = "❌ Passwords do not match.";
        responseMsg.classList.add('error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
            responseMsg.textContent = "✅ Password reset successful. You can now log in.";
            responseMsg.classList.add('success');
        } else {
            responseMsg.textContent = `❌ ${data.message}`;
            responseMsg.classList.add('error');
        }
    } catch (error) {
        responseMsg.textContent = "❌ Error resetting password.";
        responseMsg.classList.add('error');
    }
});