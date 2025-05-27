import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from "./config.js";
console.log('🔗 Connected to API server:', API_BASE_URL); // Debug log
const socket = createSocket();

function formatDateTime(isoString) {
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
}

document.addEventListener('DOMContentLoaded', () => {
    const userTableMemoryBody = document.querySelector('#userTableMemory tbody'); // For memory-related data
    const deleteAllUsersButton = document.getElementById('deleteAllUsersButton');
    const responseMessage = document.getElementById('responseMessage');
    const userTableAuthBody = document.querySelector('#userTableAuth tbody');
    console.log('🔍 userTableAuthBody:', userTableAuthBody); // Debug log


    if (!userTableAuthBody) {
        console.error('❌ userTableAuthBody is not defined. Ensure the #userTableAuth tbody element exists in the HTML.');
        return;
    }

    
     // Fetch all users from the backend
    const fetchAuthUsers = async () => {
        console.log('🔍 Fetching users from the backend...'); // Debug log
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users-info`);
            const data = await response.json();

            if (response.ok) {
                console.log('✅ Users fetched successfully:', data.users);
                populateAuthUserTable(data.users);
            } else {
                console.error('❌ Failed to fetch users:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error.message);
        }
    };

    // Function to populate the user table
   const populateAuthUserTable = (users) => {
    userTableAuthBody.innerHTML = ''; // Clear existing rows

    users.forEach((user) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.email || 'N/A'}</td>
            <td>${user.auth_id}</td>
            <td>${user.subscription_level || 'N/A'}</td>
            <td>${user.days_left !== undefined ? user.days_left : 'N/A'}</td>
        `;
        userTableAuthBody.appendChild(row);
    });
};

    fetchAuthUsers(); // Call the function to fetch and populate the table


    // Utility function to display messages
    const displayMessage = (message, isSuccess = true) => {
        responseMessage.textContent = message;
        responseMessage.style.color = isSuccess ? 'green' : 'red';
        responseMessage.style.display = 'block';

        // Hide the message after 5 seconds
        setTimeout(() => {
            responseMessage.style.display = 'none';
        }, 5000);
    };

    // Fetch all users from the backend
    const fetchMemoryUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        const data = await response.json();
        if (response.ok) {
            // Each user already has phoneNumber and authId
            populateMemoryUserTable(data.users);
            displayMessage('✅ Users fetched successfully.');
        } else {
            displayMessage(`❌ Failed to fetch users: ${data.message}`, false);
        }
    } catch (error) {
        displayMessage('❌ Error fetching users.', false);
    }
};

async function fetchAllBotsForAdmin() {
    const response = await fetch(`${API_BASE_URL}/api/admin/bots-status`);
    const data = await response.json();
    if (response.ok && data.bots) {
        const tableBody = document.getElementById('allBotsTableBody');
        tableBody.innerHTML = '';
        data.bots.forEach(bot => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bot.phoneNumber}</td>
                <td>${bot.status}</td>
                <td>${bot.server || 'Unknown'}</td>
                <td>
                    <button class="btn-primary" onclick="startBot('${bot.phoneNumber}', 'admin')">Start</button>
                    <button class="btn-danger" onclick="stopBot('${bot.phoneNumber}')">Stop</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}
    
fetchAllBotsForAdmin()

  const populateMemoryUserTable = (users) => {
    userTableMemoryBody.innerHTML = ''; // Clear existing rows

    users.forEach((user) => {
        const rom = user.rom || 'N/A';
        const authId = user.authId || user.auth_id || 'N/A';

        if (user.bots && user.bots.length > 0) {
            user.bots.forEach((bot) => {
                const row = document.createElement('tr');

                let actionsHtml = `
                    <button class="btn-danger delete-btn">Delete</button>
                    <button class="btn-primary restart-btn" style="margin-left:10px;">Restart</button>
                    <button class="btn-danger stop-btn" style="margin-left:10px;">Stop</button>
                `;
                if (bot.status !== 'Active') {
                    actionsHtml += `<button class="btn-primary start-btn" style="margin-left:10px;">Start</button>`;
                }

                row.innerHTML = `
                    <td>${bot.phoneNumber || 'N/A'}</td>
                    <td>${bot.status || 'Inactive'}</td>
                    <td>${bot.ram !== undefined ? bot.ram : 'N/A'}</td>
                    <td>${rom}</td>
                    <td><input type="number" value="${bot.maxRam !== undefined ? bot.maxRam : 10}" class="memory-input"></td>
                    <td><input type="number" value="${bot.maxRom !== undefined ? bot.maxRom : 200}" class="memory-input"></td>
                    <td>${bot.memoryUsage !== undefined ? bot.memoryUsage : 'N/A'}</td>
                    <td>
                        <button class="btn-primary update-limits-btn">Update</button>
                    </td>
                    <td>${authId}</td>
                    <td>
                        ${actionsHtml}
                    </td>
                `;

                // Add event listeners for actions
                row.querySelector('.delete-btn').addEventListener('click', () => {
                    showAdminConfirmation('delete', bot.phoneNumber, authId);
                });
                row.querySelector('.restart-btn').addEventListener('click', () => {
                    showAdminConfirmation('restart', bot.phoneNumber, authId);
                });
                row.querySelector('.stop-btn').addEventListener('click', () => {
                    showAdminConfirmation('stop', bot.phoneNumber, authId);
                });
                row.querySelector('.start-btn').addEventListener('click', () => {
                    showAdminConfirmation('start', bot.phoneNumber, authId);
                });
                row.querySelector('.update-limits-btn').addEventListener('click', async () => {
            const maxRam = parseInt(row.querySelectorAll('input')[0].value, 10);
            const maxRom = parseInt(row.querySelectorAll('input')[1].value, 10);
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${bot.phoneNumber}/memory-limits`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxRam, maxRom }),
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(`✅ Memory limits updated for user ${bot.phoneNumber}.`);
            // Update the input fields and memory usage if returned
            if (data.user) {
                row.querySelectorAll('input')[0].value = data.user.max_ram || maxRam;
                row.querySelectorAll('input')[1].value = data.user.max_rom || maxRom;
                // Optionally update RAM/ROM usage columns if returned
                if (data.user.ram !== undefined) row.cells[2].textContent = data.user.ram;
                if (data.user.rom !== undefined) row.cells[3].textContent = data.user.rom;
                if (data.user.memory_usage !== undefined) row.cells[6].textContent = data.user.memory_usage;
            }
        } else {
            displayMessage(`❌ Failed to update memory limits for user ${bot.phoneNumber}: ${data.message}`, false);
        }
    } catch (error) {
        displayMessage(`❌ Error updating memory limits for user ${bot.phoneNumber}.`, false);
    }
});

const switchCell = document.createElement('td');
switchCell.innerHTML = `
    <select class="server-select"></select>
    <button class="btn-primary switch-server-btn">Switch</button>
`;
row.appendChild(switchCell);

// Populate server dropdown
const serverSelect = switchCell.querySelector('.server-select');
fetch(`${API_BASE_URL}/api/admin/server-status`)
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            for (const serverId in data.status) {
                const option = document.createElement('option');
                option.value = serverId;
                option.textContent = serverId + (data.status[serverId].healthy ? ' (Online)' : ' (Offline)');
                if (!data.status[serverId].healthy) option.disabled = true;
                serverSelect.appendChild(option);
            }
        }
    });

// Switch server button event
switchCell.querySelector('.switch-server-btn').addEventListener('click', async () => {
    const newServerId = serverSelect.value;
    const phoneNumber = bot.phoneNumber;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/switch-server`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, newServerId }),
        });
        const data = await response.json();
        if (response.ok) {
            alert(`✅ User switched to server ${newServerId}`);
            fetchServerStatus(); // Refresh server status
        } else {
            alert(`❌ Failed to switch server: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error switching server.');
    }
});


switchCell.querySelector('.switch-server-btn').addEventListener('click', async () => {
    const newServerId = serverSelect.value;
    const phoneNumber = bot.phoneNumber;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/switch-server`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, newServerId }),
        });
        const data = await response.json();
        if (response.ok) {
            alert(`✅ User switched to server ${newServerId}`);
            fetchServerStatus(); // Refresh server status
        } else {
            alert(`❌ Failed to switch server: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error switching server.');
    }
});

                userTableMemoryBody.appendChild(row);
            });
        } else {
            // If user has no bots, show a placeholder row
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="10" style="text-align:center;">No bots found for this user.</td>`;
            userTableMemoryBody.appendChild(row);
        }
    });
};

const adminConfirmationModal = document.getElementById('confirmationModal');
const adminModalMessage = document.getElementById('modalMessage');
const adminConfirmButton = document.getElementById('confirmButton');
const adminCancelButton = document.getElementById('cancelButton');

function showAdminConfirmation(action, phoneNumber, authId) {
    adminConfirmationModal.classList.remove('hidden');
    adminModalMessage.innerHTML = `
        <img src="./image/beyond.jpg" alt="Confirmation Background" style="width:100%;max-width:200px;display:block;margin:auto;">
        <p>Are you sure you want to <strong>${action}</strong> the bot for <strong>${phoneNumber}</strong>?</p>
    `;
    adminConfirmButton.onclick = async () => {
        adminConfirmationModal.classList.add('hidden');
        if (action === 'restart') await restartBot(phoneNumber, authId);
        if (action === 'delete') await deleteUser(phoneNumber);
        if (action === 'stop') await stopBot(phoneNumber);
        if (action === 'start') await startBot(phoneNumber, authId);
    };
    adminCancelButton.onclick = () => adminConfirmationModal.classList.add('hidden');
}

// Attach to global for HTML inline use if needed
window.showAdminConfirmation = showAdminConfirmation;

const updateMemoryLimits = async (phoneNumber, maxRam, maxRom) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${phoneNumber}/memory-limits`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxRam, maxRom }),
        });

        const data = await response.json();
        if (response.ok) {
            displayMessage(`✅ Memory limits updated for user ${phoneNumber}.`);

            // Refresh the specific row with updated data
            const updatedUser = data.user;
            const row = Array.from(userTableMemoryBody.rows).find(
                (r) => r.cells[0].textContent === phoneNumber
            );

            if (row) {
                row.cells[2].querySelector('input').value = updatedUser.max_ram; // Update Max RAM
                row.cells[3].querySelector('input').value = updatedUser.max_rom; // Update Max ROM
                row.cells[4].textContent = updatedUser.memory_usage || 'N/A'; // Update Memory Usage
            }
        } else {
            displayMessage(`❌ Failed to update memory limits for user ${phoneNumber}: ${data.message}`, false);
        }
    } catch (error) {
        displayMessage(`❌ Error updating memory limits for user ${phoneNumber}.`, false);
    }
};

    // Delete a specific user
    const deleteUser = async (phoneNumber) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${phoneNumber}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                displayMessage(`✅ User ${phoneNumber} deleted successfully.`);
                fetchUsers(); // Refresh the user list
                
            } else {
                displayMessage(`❌ Failed to delete user ${phoneNumber}: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage(`❌ Error deleting user ${phoneNumber}.`, false);
        }
    };

    // Restart a bot
    const restartBot = async (phoneNumber, authId) => {
        console.log('🔄 Restarting bot for phone number:', phoneNumber, authId); // Debug log
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/restart-bot/${phoneNumber}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authId }),
            });

            const data = await response.json();
            console.log('🔄 Restart response:', data); // Debug log
            if (response.ok) {
                displayMessage(`✅ Bot for ${phoneNumber} restarted successfully.`);
            } else {
                displayMessage(`❌ Failed to restart bot for ${phoneNumber}: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage(`❌ Error restarting bot for ${phoneNumber}.`, false);
        }
    };

    // Fetch memory usage for all users
        const fetchMemoryUsage = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/memory-usage`);
            const data = await response.json();

            if (response.ok) {
                console.log('✅ Memory usage fetched successfully:', data.memoryUsage); // Debug log
                populateMemoryUsage(data.memoryUsage);
            } else {
                displayMessage(`❌ Failed to fetch memory usage: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage('❌ Error fetching memory usage.', false);
        }
    };

    // Populate memory usage in the user table
        const populateMemoryUsage = (memoryUsage) => {
        const rows = document.querySelectorAll('#userTableMemory tbody tr'); // Select all rows in the memory table

        memoryUsage.forEach((usage) => {
            const row = Array.from(rows).find((r) => r.cells[0].textContent === usage.phoneNumber); // Match by phone number
            if (row) {
                const memoryCell = row.cells[4]; // Memory Usage column
                memoryCell.textContent = usage.memoryUsage; // Update the memory usage
            }
        });
    };   

    const stopBot = async (phoneNumber) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stop-bot/${phoneNumber}`, { method: 'POST' });
        const data = await response.json();
        alert(data.message);
        fetchMemoryUsers();
    } catch (error) {
        alert('❌ Error stopping bot.');
    }
};

const startBot = async (phoneNumber, authId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/start-bot/${phoneNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });
        const data = await response.json();
        alert(data.message);
        fetchMemoryUsers();
    } catch (error) {
        alert('❌ Error starting bot.');
    }
};
    // Delete all users
    deleteAllUsersButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                displayMessage('✅ All users deleted successfully.');
                fetchMemoryUsers(); // Refresh the user list
            } else {
                displayMessage(`❌ Failed to delete all users: ${data.message}`, false);
            }
        } catch (error) {
            displayMessage('❌ Error deleting all users.', false);
        }
    });

    // Fetch users and memory usage on page load
    fetchMemoryUsers().then(fetchMemoryUsage);
});


// Listen for account deletion requests
socket.on('account-deletion-request', (data) => {
    const { authId } = data;

    const li = document.createElement('li');
    li.innerHTML = `
        <strong>Account Deletion Request:</strong> User with Auth ID <strong>${authId}</strong> has requested account deletion.
    `;
    const complaintsList = document.getElementById('complaintsList');
    complaintsList.appendChild(li);
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sendNotificationButton').addEventListener('click', async () => {
        const messageInput = document.getElementById('notificationMessageInput');
        if (!messageInput) {
            console.error('❌ notificationMessageInput element not found in the DOM.');
            return;
        }

        const message = messageInput.value.trim();

        if (!message) {
            alert('Please enter a notification message.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            if (response.ok) {
                alert('✅ Notification sent successfully.');
            } else {
                alert(`❌ Failed to send notification: ${data.message}`);
            }
        } catch (error) {
            alert('❌ Error sending notification.');
        }
    });
});

const fetchComplaints = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/complaints`);
        const data = await response.json();

        if (response.ok) {
            const complaintsList = document.getElementById('complaintsList');
            complaintsList.innerHTML = ''; // Clear existing complaints

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

                // Add event listener for this button
                li.querySelector('.mark-read-complaint').addEventListener('click', async (e) => {
                    const timestamp = e.target.getAttribute('data-timestamp');
                    await fetch(`${API_BASE_URL}/api/admin/complaints/${timestamp}`, { method: 'DELETE' });
                    fetchComplaints(); // Refresh the list
                });
            });
        } else {
            console.error('❌ Failed to fetch complaints:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching complaints:', error.message);
    }
};

// Fetch complaints on page load
fetchComplaints();

document.getElementById('deleteUserButton').addEventListener('click', async () => {
    const authId = document.getElementById('authIdInputDelete').value.trim();

    console.log('Auth ID input value:', authId);
    if (!authId) {
        alert('Please enter a valid Auth ID.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/delete-user`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('deleteUserResponseMessage').textContent = `✅ User with Auth ID ${authId} deleted successfully.`;
            document.getElementById('deleteUserResponseMessage').style.color = 'green';
        } else {
            document.getElementById('deleteUserResponseMessage').textContent = `❌ Failed to delete user: ${data.message}`;
            document.getElementById('deleteUserResponseMessage').style.color = 'red';
        }
    } catch (error) {
        document.getElementById('deleteUserResponseMessage').textContent = '❌ Error deleting user.';
        document.getElementById('deleteUserResponseMessage').style.color = 'red';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const viewAllBotsButton = document.getElementById('viewAllBotsButton');

    if (viewAllBotsButton) {
        viewAllBotsButton.addEventListener('click', () => {
            window.location.href = 'admin-bots.html'; // Redirect to the Admin Bots page
        });
    }
});

document.getElementById('sendUserNotificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const authId = document.getElementById('authIdInputNotify').value.trim();
    const message = document.getElementById('messageInput').value.trim();
    console.log('🔍 Sending notification to Auth ID:', authId); // Debug log

    if (!authId || !message) {
        alert('Please fill in both fields.');
        return;
    }

    console.log('🔍 Sending notification to Auth ID:', authId); // Debug log

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/send-user-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId, message }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('sendNotificationResponseMessage').textContent = '✅ Notification sent successfully.';
            document.getElementById('sendNotificationResponseMessage').style.color = 'green';
        } else {
            document.getElementById('sendNotificationResponseMessage').textContent = `❌ Failed to send notification: ${data.message}`;
            document.getElementById('sendNotificationResponseMessage').style.color = 'red';
        }
    } catch (error) {
        document.getElementById('sendNotificationResponseMessage').textContent = '❌ Error sending notification.';
        document.getElementById('sendNotificationResponseMessage').style.color = 'red';
    }
});

document.getElementById('generateTokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();

   const authIdInput = document.getElementById('authIdInputToken');
    if (!authIdInput) {
        alert('Auth ID input field for token generation not found.');
        return;
    }
    const authId = authIdInput.value.trim();

    // For subscription level, get the checked radio button:
    const subscriptionLevel = document.querySelector('input[name="subscriptionLevel"]:checked').value;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/generate-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId, subscriptionLevel }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('generateTokenResponseMessage').textContent = `✅ Token generated: ${data.tokenId}`;
        } else {
            document.getElementById('generateTokenResponseMessage').textContent = `❌ ${data.message}`;
        }
    } catch (error) {
        document.getElementById('generateTokenResponseMessage').textContent = '❌ Error generating token.';
    }
});

document.getElementById('syncMemoryButton').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/sync-memory`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
            alert('✅ Memory synced to Supabase.');
        } else {
            alert(`❌ Failed to sync memory: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Error syncing memory.');
    }
});


// Add event listener after rendering:
document.querySelectorAll('.mark-read-complaint').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const timestamp = e.target.getAttribute('data-timestamp');
        await fetch(`${API_BASE_URL}/api/admin/complaints/${timestamp}`, { method: 'DELETE' });
        fetchComplaints(); // Refresh the list
    });
});

// --- Server Status Table ---
const serverStatusTableBody = document.querySelector('#serverStatusTable tbody');

async function fetchServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/server-status`);
        const data = await response.json();
        if (response.ok && data.status) {
            populateServerStatusTable(data.status);
        }
    } catch (error) {
        console.error('❌ Error fetching server status:', error);
    }
}

function populateServerStatusTable(status) {
    serverStatusTableBody.innerHTML = '';
    for (const [serverId, info] of Object.entries(status)) {
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



window.startBot = async (phoneNumber, authId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/load-session/${phoneNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authId }),
        });
        const data = await response.json();
        alert(data.message);
        fetchBotInfo(); // Refresh the table
    } catch (error) {
        alert('❌ Error starting bot.');
    }
};

// Poll server status every 30 seconds
setInterval(fetchServerStatus, 30000);
fetchServerStatus();

