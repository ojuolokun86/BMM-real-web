import { API_BASE_URL, createSocket } from "./config.js";
const socket = createSocket();

function formatDateTime(isoString) {
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
}

document.addEventListener('DOMContentLoaded', () => {
    const allBotsTableBody = document.getElementById('allBotsTableBody');
    const responseMessage = document.getElementById('responseMessage');
    const serverStatusTableBody = document.querySelector('#serverStatusTable tbody');

    // --- Fetch and Render All Bots ---
    async function fetchAllBots() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/bots-status`);
            const { bots } = await res.json();
            allBotsTableBody.innerHTML = '';
            bots.forEach(bot => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${bot.phoneNumber || 'N/A'}</td>
                    <td>${bot.authId || 'N/A'}</td>
                    <td>${bot.status || 'N/A'}</td>
                    <td>${bot.ram || 'N/A'}</td>
                    <td>${bot.rom || 'N/A'}</td>
                    <td>${bot.memoryUsage || 'N/A'}</td>
                    <td>${bot.server || 'N/A'}</td>
                    <td>
                        <button class="btn-primary" onclick="restartBot('${bot.phoneNumber}','${bot.authId}')">Restart</button>
                        <button class="btn-danger" onclick="stopBot('${bot.phoneNumber}')">Stop</button>
                        <button class="btn-primary" onclick="startBot('${bot.phoneNumber}','${bot.authId}')">Start</button>
                        <button class="btn-danger" onclick="deleteUser('${bot.phoneNumber}')">Delete</button>
                        <select onchange="switchServer('${bot.phoneNumber}', this.value)">
                            <option value="">Switch Server</option>
                            <option value="railway">Railway</option>
                            <option value="render">Render</option>
                            <option value="flyio">Fly.io</option>
                        </select>
                    </td>
                `;
                allBotsTableBody.appendChild(row);
            });
        } catch (error) {
            allBotsTableBody.innerHTML = `<tr><td colspan="8">❌ Error loading bots</td></tr>`;
        }
    }

    // --- Admin Actions ---
    window.restartBot = async (phoneNumber, authId) => {
        await fetch(`${API_BASE_URL}/api/admin/restart-bot/${phoneNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });
        fetchAllBots();
    };
    window.stopBot = async (phoneNumber) => {
        await fetch(`${API_BASE_URL}/api/admin/stop-bot/${phoneNumber}`, { method: 'POST' });
        fetchAllBots();
    };
    window.startBot = async (phoneNumber, authId) => {
        await fetch(`${API_BASE_URL}/api/admin/start-bot/${phoneNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });
        fetchAllBots();
    };
    window.deleteUser = async (phoneNumber) => {
        await fetch(`${API_BASE_URL}/api/admin/users/${phoneNumber}`, { method: 'DELETE' });
        fetchAllBots();
    };
    window.switchServer = async (phoneNumber, serverId) => {
        if (!serverId) return;
        await fetch(`${API_BASE_URL}/api/admin/switch-server`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, newServerId: serverId }),
        });
        fetchAllBots();
    };

    // --- Server Status Table ---
    async function fetchServerStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/server-status`);
            const data = await response.json();
            if (response.ok && data.status) {
                serverStatusTableBody.innerHTML = '';
                for (const [serverId, info] of Object.entries(data.status)) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${serverId}</td>
                        <td style="color:${info.healthy ? 'green' : 'red'};">
                            ${info.healthy ? 'Online' : 'Offline'}
                        </td>
                        <td>${info.load !== undefined ? info.load : 'N/A'}</td>
                    `;
                    serverStatusTableBody.appendChild(row);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching server status:', error);
        }
    }

    // --- Notification Section ---
    document.getElementById('sendNotificationButton')?.addEventListener('click', async () => {
        const messageInput = document.getElementById('notificationMessageInput');
        if (!messageInput) return;
        const message = messageInput.value.trim();
        if (!message) return alert('Please enter a notification message.');
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();
            alert(response.ok ? '✅ Notification sent successfully.' : `❌ Failed: ${data.message}`);
        } catch (error) {
            alert('❌ Error sending notification.');
        }
    });

    // --- Complaints Section ---
    async function fetchComplaints() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/complaints`);
            const data = await response.json();
            if (response.ok) {
                const complaintsList = document.getElementById('complaintsList');
                complaintsList.innerHTML = '';
                data.complaints.forEach((complaint) => {
                    const { date, time } = formatDateTime(complaint.timestamp);
                    const isDeletion = complaint.message && complaint.message.includes('[Account Deletion Request]');
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div style="margin-bottom: 6px;">
                            <span class="notif-date">${date}</span>
                            <span class="notif-time">${time}</span>
                        </div>
                        <div>
                            <strong style="color:#ffd700;">Auth ID:</strong>
                            <span style="color:#00aaff;font-weight:bold;">${complaint.auth_id}</span>
                        </div>
                        <div style="margin: 8px 0 10px 0;">
                            <strong style="color:#00aaff;">Message:</strong>
                            <span style="color:${isDeletion ? '#ff3b3b' : '#fff'};font-weight:bold;">
                                ${complaint.message}
                            </span>
                        </div>
                        <button class="btn-secondary mark-read-complaint" data-timestamp="${complaint.timestamp}">Mark as Read</button>
                    `;
                    if (isDeletion) {
                        li.style.borderLeft = '6px solid #ff3b3b';
                        li.style.background = '#2a1a1a';
                    }
                    complaintsList.appendChild(li);
                    li.querySelector('.mark-read-complaint').addEventListener('click', async (e) => {
                        const timestamp = e.target.getAttribute('data-timestamp');
                        await fetch(`${API_BASE_URL}/api/admin/complaints/${timestamp}`, { method: 'DELETE' });
                        fetchComplaints();
                    });
                });
            }
        } catch (error) {
            console.error('❌ Error fetching complaints:', error);
        }
    }

    // --- Token Generation ---
    document.getElementById('generateTokenForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const authIdInput = document.getElementById('authIdInputToken');
        if (!authIdInput) return alert('Auth ID input field for token generation not found.');
        const authId = authIdInput.value.trim();
        const subscriptionLevel = document.querySelector('input[name="subscriptionLevel"]:checked').value;
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/generate-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId, subscriptionLevel }),
            });
            const data = await response.json();
            document.getElementById('generateTokenResponseMessage').textContent =
                response.ok ? `✅ Token generated: ${data.tokenId}` : `❌ ${data.message}`;
        } catch (error) {
            document.getElementById('generateTokenResponseMessage').textContent = '❌ Error generating token.';
        }
    });

    // --- User Notification ---
    document.getElementById('sendUserNotificationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const authId = document.getElementById('authIdInputNotify').value.trim();
        const message = document.getElementById('messageInput').value.trim();
        if (!authId || !message) return alert('Please fill in both fields.');
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/send-user-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId, message }),
            });
            const data = await response.json();
            document.getElementById('sendNotificationResponseMessage').textContent =
                response.ok ? '✅ Notification sent successfully.' : `❌ Failed: ${data.message}`;
        } catch (error) {
            document.getElementById('sendNotificationResponseMessage').textContent = '❌ Error sending notification.';
        }
    });

    // --- Delete User by Auth ID ---
    document.getElementById('deleteUserButton')?.addEventListener('click', async () => {
        const authId = document.getElementById('authIdInputDelete').value.trim();
        if (!authId) return alert('Please enter a valid Auth ID.');
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/delete-user`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });
            const data = await response.json();
            document.getElementById('deleteUserResponseMessage').textContent =
                response.ok
                    ? `✅ User with Auth ID ${authId} deleted successfully.`
                    : `❌ Failed to delete user: ${data.message}`;
            document.getElementById('deleteUserResponseMessage').style.color = response.ok ? 'green' : 'red';
        } catch (error) {
            document.getElementById('deleteUserResponseMessage').textContent = '❌ Error deleting user.';
            document.getElementById('deleteUserResponseMessage').style.color = 'red';
        }
    });

    // --- Sync Memory Button ---
    document.getElementById('syncMemoryButton')?.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/sync-memory`, { method: 'POST' });
            const data = await response.json();
            alert(response.ok ? '✅ Memory synced to Supabase.' : `❌ Failed: ${data.message}`);
        } catch (error) {
            alert('❌ Error syncing memory.');
        }
    });

    // --- View All Bots Button ---
    document.getElementById('viewAllBotsButton')?.addEventListener('click', () => {
        window.location.href = 'admin-bots.html';
    });

    const userTableAuthBody = document.querySelector('#userTableAuth tbody');

async function fetchAllUsers() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users-info`);
        const { users } = await res.json();
        userTableAuthBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email || 'N/A'}</td>
                <td>${user.auth_id || 'N/A'}</td>
                <td>${user.subscription_level || 'N/A'}</td>
                <td>${user.days_left || 'N/A'}</td>
            `;
            userTableAuthBody.appendChild(row);
        });
    } catch (error) {
        userTableAuthBody.innerHTML = `<tr><td colspan="4">❌ Error loading users</td></tr>`;
    }
}

const deleteAllUsersBtn = document.getElementById('deleteAllUsersButton');
const deleteResponseMessage = document.getElementById('deleteResponseMessage');

if (deleteAllUsersBtn) {
    deleteAllUsersBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete ALL users and bots? This cannot be undone.')) return;
        deleteResponseMessage.textContent = '⏳ Deleting all users...';
        deleteResponseMessage.className = 'message';

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users`, { method: 'DELETE' });
            const data = await response.json();

            if (response.ok && data.success) {
                deleteResponseMessage.textContent = '✅ All users and bots deleted successfully.';
                deleteResponseMessage.className = 'message success';
            } else {
                deleteResponseMessage.textContent = `❌ Failed to delete all users: ${data.message || 'Unknown error.'}`;
                deleteResponseMessage.className = 'message error';
            }
        } catch (error) {
            deleteResponseMessage.textContent = `❌ Error deleting all users: ${error.message}`;
            deleteResponseMessage.className = 'message error';
        }
    });
}

// Call this after DOMContentLoaded
fetchAllUsers();
    // --- Initial Loads ---
    fetchAllBots();
    fetchServerStatus();
    fetchComplaints();
    setInterval(fetchServerStatus, 30000); // Poll server status every 30s
});

