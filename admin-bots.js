import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from './config.js';


const socket = createSocket();
console.log('🔗 Connected to WebSocket:', SOCKET_BASE_URL);

const fetchAllBots = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/all-bots`);
        const data = await response.json();

        if (response.ok) {
            const userBotsTable = document.getElementById('userBotsTable').querySelector('tbody');
            userBotsTable.innerHTML = ''; // Clear existing rows

            data.bots.forEach((bot) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${bot.authId}</td>
                    <td>${bot.phoneNumber}</td>
                    <td>${bot.status}</td>
                    <td>${bot.ram || 'N/A'}</td>
                    <td>${bot.rom || 'N/A'}</td>
                `;
                userBotsTable.appendChild(row);
            });
        } else {
            console.error('❌ Failed to fetch bots:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching bots:', error.message);
    }
};

// Fetch bots on page load
fetchAllBots();

// Function to update the metrics table dynamically
// Function to update the metrics table dynamically
const updateMetricsTable = (metricsArray) => {
    const metricsTableBody = document.getElementById('metricsTable').querySelector('tbody');
    metricsTableBody.innerHTML = ''; // Clear existing rows

    metricsArray.forEach((metric) => {
        const { authId, phoneNumber, messageProcessingTime, queueProcessingTime, commandProcessingTime } = metric;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${authId || 'N/A'}</td>
            <td>${phoneNumber || 'N/A'}</td>
            <td>${messageProcessingTime || 'N/A'} ms</td>
            <td>${queueProcessingTime || 'N/A'} ms</td>
            <td>${commandProcessingTime || 'N/A'} ms</td>
        `;
        metricsTableBody.appendChild(row);
    });
};

// Listen for live metrics updates via WebSocket
socket.on('metrics-update', (metrics) => {
    console.log('📥 Received live metrics update:', metrics);
    updateMetricsTable(metrics);
});

// Fetch initial metrics on page load
const fetchAllMetrics = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/metrics/users`);
        const data = await response.json();

        if (response.ok) {
            updateMetricsTable(data.metrics);
        } else {
            console.error('❌ Failed to fetch metrics:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching metrics:', error.message);
    }
};
// Fetch metrics on page load
fetchAllMetrics();