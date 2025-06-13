import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from './config.js';
console.log('🔗 Connected to WebSocket server'); // Debug log

// Wait for DOM to be ready before running any code
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const botInfoTable = document.querySelector('#botInfoTable tbody');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationHistory = document.getElementById('notificationHistory');
    const activityLog = document.getElementById('activityLog');
    const performanceChart = document.getElementById('performanceChart').getContext('2d');
    const userGreeting = document.getElementById('userGreeting');
    const confirmationModal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    const registerBotButton = document.getElementById('registerBotButton');

    // Socket.IO connection
    const socket = createSocket();
    const authId = localStorage.getItem('auth_id');
    if (authId) {
        socket.emit('authId', authId);
    }

    // Format date/time
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}`
        };
    }

    // Render notifications
    function renderNotificationList(notifications) {
        notificationHistory.innerHTML = '';
        notifications.forEach((notification) => {
            const { date, time } = formatDateTime(notification.timestamp);
            let message = notification.message;
            const expMatch = message.match(/Expires on (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
            if (expMatch) {
                const expDate = expMatch[1];
                const { date: expDateOnly, time: expTimeOnly } = formatDateTime(expDate);
                message = message.replace(expDate, `${expDateOnly} ${expTimeOnly}`);
            }
            const li = document.createElement('li');
            li.classList.add('notification-card');
            li.innerHTML = `
                <div class="notification-header">
                    <span class="notif-sender">${notification.sender}</span>
                    <span class="notif-date">${date}</span>
                    <span class="notif-time">${time}</span>
                </div>
                <div class="notification-message">${message}</div>
                ${notification.needsRescan ? `<button class="btn-primary rescan-button" data-phone="${notification.phoneNumber}">Rescan</button>` : ''}
                <button class="btn-secondary mark-read-button" data-id="${notification.id}">Mark as Read</button>
            `;
            notificationHistory.appendChild(li);
        });

        // Mark as read
        document.querySelectorAll('.mark-read-button').forEach((button) => {
            button.addEventListener('click', async (e) => {
                const notificationId = e.target.getAttribute('data-id');
                await markNotificationAsRead(notificationId);
            });
        });

        // Rescan
        document.querySelectorAll('.rescan-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const phoneNumber = e.target.getAttribute('data-phone');
                window.location.href = `register-bot.html?phoneNumber=${phoneNumber}`;
            });
        });
    }

    // Fetch user summary
    async function fetchUserSummary() {
        if (!authId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/summary?authId=${authId}`);
            const data = await response.json();
            console.log(`User summary data:`, data);
            if (response.ok) {
                const email = data.email || 'Unknown';
                const username = email.split('@')[0];
                userGreeting.textContent = `Hello, ${username}! You have ${data.totalBots} bots, ${data.activeBots} active.`;
            } else {
                userGreeting.textContent = '❌ Failed to fetch user summary.';
            }
        } catch {
            userGreeting.textContent = '❌ Error fetching user summary.';
        }
    }

    // Fetch bot info
    async function fetchBotInfo() {
        if (!authId) return;
        try {
            console.log('📩Fetching bot info for authId:', authId);
            const response = await fetch(`${API_BASE_URL}/api/user/bot-info?authId=${authId}`);
            const data = await response.json();
            console.log('Bot info data:', data);
            notificationMessage.classList.remove('error', 'info', 'success');
            botInfoTable.innerHTML = '';
            if (response.ok && Array.isArray(data.bots) && data.bots.length > 0) {
                notificationMessage.textContent = '';
                data.bots.forEach((bot) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${bot.phoneNumber}</td>
                        <td><span class="badge ${bot.status === 'Active' ? 'badge-success' : 'badge-danger'}">${bot.status}</span></td>
                        <td>${bot.ram || 'N/A'}</td>
                        <td>${bot.rom || data.totalROM || 'N/A'}</td>
                        <td>${bot.uptime || 'N/A'}</td>
                        <td>${bot.lastActive ? formatDateTime(bot.lastActive).date + ' ' + formatDateTime(bot.lastActive).time : 'N/A'}</td>
                        <td>${bot.version || 'N/A'}</td>
                        <td>
                            <button class="btn-primary" onclick="showConfirmation('restart', '${bot.phoneNumber}')">Restart</button>
                            <button class="btn-danger" onclick="showConfirmation('delete', '${bot.phoneNumber}')">Delete</button>
                            ${bot.status !== 'Active' ? `<button class="btn-primary" onclick="startBot('${bot.phoneNumber}', '${authId}')">Start</button>` : ''}
                        </td>
                    `;
                    botInfoTable.appendChild(row);
                });
            } else {
                notificationMessage.textContent = 'You have not registered any bots yet.';
                notificationMessage.classList.add('info');
            }
        } catch {
            notificationMessage.textContent = '❌ Error fetching bot info.';
            notificationMessage.classList.add('error');
        }
    }

    // Fetch activity log
    async function fetchActivityLog() {
        if (!authId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/activity-log?authId=${authId}`);
            const data = await response.json();
            activityLog.innerHTML = '';
            if (response.ok && Array.isArray(data.activities) && data.activities.length > 0) {
                data.activities.forEach((activity) => {
                    const li = document.createElement('li');
                    li.textContent = `${activity.timestamp}: ${activity.action}`;
                    activityLog.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No recent activities.';
                activityLog.appendChild(li);
            }
        } catch {
            const li = document.createElement('li');
            li.textContent = '❌ Error fetching activity log.';
            activityLog.appendChild(li);
        }
    }

    // Fetch notifications
    async function fetchNotifications() {
        if (!authId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/notifications?authId=${authId}`);
            const data = await response.json();
            if (response.ok) {
                renderNotificationList(data.notifications);
            } else {
                notificationHistory.innerHTML = `<li class="error">❌ ${data.message}</li>`;
            }
        } catch {
            notificationHistory.innerHTML = `<li class="error">❌ Error fetching notifications. Please try again later.</li>`;
        }
    }

    // Mark notification as read
    async function markNotificationAsRead(notificationId) {
        if (!authId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/notifications/${notificationId}/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });
            if (response.ok) fetchNotifications();
        } catch {
            alert('❌ Error marking notification as read.');
        }
    }

    // Show confirmation modal
    window.showConfirmation = (action, phoneNumber) => {
        confirmationModal.classList.remove('hidden');
        let actionColor = '#00aaff';
        if (action === 'delete') actionColor = '#dc3545';
        if (action === 'restart') actionColor = '#ffd700';
        modalMessage.innerHTML = `
            <span style="font-size:1.1rem;font-weight:bold;line-height:1.5;">
                Are you sure you want to
                <span style="color:${actionColor};text-transform:uppercase;">${action}</span>
                the bot for
                <span style="color:#00aaff;">${phoneNumber}</span>?
            </span>
        `;
        confirmButton.onclick = () => {
            confirmationModal.classList.add('hidden');
            if (action === 'restart') restartBot(phoneNumber);
            if (action === 'delete') deleteBot(phoneNumber);
        };
        cancelButton.onclick = () => confirmationModal.classList.add('hidden');
    };

    // Start bot
    window.startBot = async (phoneNumber, authId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/load-session/${phoneNumber}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });
            const data = await response.json();
            alert(data.message);
            fetchBotInfo();
        } catch {
            alert('❌ Error starting bot.');
        }
    };

    // Restart bot
    async function restartBot(phoneNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/restart-bot/${phoneNumber}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });
            const data = await response.json();
            if (response.ok) {
                addNotification(`✅ Bot restarted successfully for ${phoneNumber}.`, 'success');
                fetchBotInfo();
            } else {
                addNotification(`❌ Failed to restart bot for ${phoneNumber}: ${data.message}`, 'error');
            }
        } catch {
            addNotification(`❌ Error restarting bot for ${phoneNumber}.`, 'error');
        }
    }

    // Delete bot
    window.deleteBot = async (phoneNumber) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/delete-bot/${phoneNumber}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });
            const data = await response.json();
            if (response.ok) {
                addNotification(`✅ Bot deleted successfully for ${phoneNumber}.`, 'success');
                fetchBotInfo();
            } else {
                addNotification(`❌ Failed to delete bot for ${phoneNumber}: ${data.message}`, 'error');
            }
        } catch {
            addNotification(`❌ Error deleting bot for ${phoneNumber}.`, 'error');
        }
    };

    // Add notification
    function addNotification(message, type) {
        const li = document.createElement('li');
        li.textContent = message;
        li.classList.add(type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');
        notificationHistory.appendChild(li);
    }

    // Chart.js
    let chartInstance = null;
    function initializeChart(data) {
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(performanceChart, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Command Processing Time (ms)',
                        data: data.commandProcessingTime,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    },
                ],
            },
        });
    }

  

    // Handle bot errors from socket
    socket.on('bot-error', (data) => {
        const { phoneNumber, message, needsRescan } = data;
        const li = document.createElement('li');
        li.innerHTML = `
            ❌ Bot error for ${phoneNumber}: ${message}
            ${needsRescan ? `<button class="btn-primary rescan-button" data-phone="${phoneNumber}">Rescan</button>` : ''}
        `;
        notificationHistory.appendChild(li);
        if (needsRescan) {
            li.querySelector('.rescan-button').addEventListener('click', () => {
                window.location.href = `register-bot.html?phoneNumber=${phoneNumber}`;
            });
        }
    });

      // Fetch performance trends
    socket.on('analytics-update', (analytics) => {
    console.log('Real-time analytics:', analytics);
    // Clone arrays to avoid Chart.js mutation issues
    initializeChart({
        labels: [...analytics.labels],
        commandProcessingTime: [...analytics.commandProcessingTime]
    });
});

    // Listen for notifications from admin
    socket.on('user-notification', (data) => {
        const { message } = data;
        const li = document.createElement('li');
        li.textContent = `📢 Admin Notification: ${message}`;
        notificationHistory.appendChild(li);
    });

    // Handle bot registration success (from iframe or popup)
    window.addEventListener('message', (event) => {
        if (event.data.type === 'bot-registered') {
            notificationMessage.textContent = `✅ Bot registered successfully for ${event.data.phoneNumber}`;
            notificationMessage.classList.add('success');
            fetchBotInfo();
        }
    });

    // Register bot button
    registerBotButton.addEventListener('click', () => {
        if (!authId) {
            notificationMessage.textContent = '❌ Auth ID is missing. Please log in again.';
            notificationMessage.classList.add('error');
            return;
        }
        window.location.href = `register-bot.html?authId=${authId}`;
    });

    // Complaint
    document.getElementById('submitComplaintButton').addEventListener('click', async () => {
        const message = document.getElementById('complaintInput').value;
        if (!message.trim()) {
            alert('Please enter a complaint.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/submit-complaint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId, message }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ Complaint submitted successfully.');
            } else {
                alert(`❌ Failed to submit complaint: ${data.message}`);
            }
        } catch {
            alert('❌ Error submitting complaint.');
        }
    });

    // Account deletion
    document.getElementById('requestAccountDeletionButton').addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/request-account-deletion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ Account deletion request submitted successfully.');
            } else {
                alert(`❌ Failed to submit account deletion request: ${data.message}`);
            }
        } catch {
            alert('❌ Error submitting account deletion request.');
        }
    });

    // Token input form
    document.getElementById('tokenInputForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tokenId = document.getElementById('tokenInput').value.trim();
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId, tokenId }),
            });
            const data = await response.json();
            if (response.ok) {
                document.getElementById('tokenResponseMessage').textContent = '✅ Token validated successfully.';
                fetchSubscriptionDetails();
            } else {
                document.getElementById('tokenResponseMessage').textContent = `❌ ${data.message}`;
            }
        } catch {
            document.getElementById('tokenResponseMessage').textContent = '❌ Error validating token.';
        }
    });

    // Subscription details
    async function fetchSubscriptionDetails() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/subscription?authId=${authId}`);
            const data = await response.json();
            const subscriptionLevelSpan = document.getElementById('subscriptionLevel');
            subscriptionLevelSpan.classList.remove('subscription-basic', 'subscription-gold', 'subscription-premium', 'subscription-trier');
            if (response.ok) {
                let badgeClass = '';
                switch ((data.subscriptionLevel || '').toLowerCase()) {
                    case 'basic': badgeClass = 'subscription-basic'; break;
                    case 'gold': badgeClass = 'subscription-gold'; break;
                    case 'premium': badgeClass = 'subscription-premium'; break;
                    case 'trier': badgeClass = 'subscription-trier'; break;
                    default: badgeClass = '';
                }
                subscriptionLevelSpan.textContent = data.subscriptionLevel;
                if (badgeClass) subscriptionLevelSpan.classList.add(badgeClass);
                document.getElementById('daysLeft').textContent = data.daysLeft;
            } else if (response.status === 404) {
                const summaryResponse = await fetch(`${API_BASE_URL}/api/user/summary?authId=${authId}`);
                const summaryData = await summaryResponse.json();
                const email = summaryData.email || 'this user';
                document.getElementById('subscriptionDetails').textContent = `No subscription for ${email}`;
            } else {
                document.getElementById('subscriptionDetails').textContent = '❌ Failed to fetch subscription details.';
            }
        } catch {
            document.getElementById('subscriptionDetails').textContent = '❌ Error fetching subscription details.';
        }
    }

    // Initial fetches
    fetchUserSummary();
    fetchBotInfo();
    fetchActivityLog();
    fetchNotifications();
    fetchSubscriptionDetails();
});