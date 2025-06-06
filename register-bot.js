import { API_BASE_URL, SOCKET_BASE_URL, createSocket } from "./config.js";
import { parsePhoneNumberFromString } from 'https://esm.sh/libphonenumber-js@1.10.24';

let lastFormattedNumber = null;
let lastAuthId = null;

const socket = createSocket();
console.log('🔗 Connected to WebSocket server'); // Debug log

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authId = urlParams.get('authId'); // Extract auth_id from query parameters

    if (!authId) {
        console.error('❌ Auth ID is missing in the URL.');
        return;
    }

    console.log(`🔍 Auth ID retrieved from URL: ${authId}`); // Debug log

    // Store auth_id in local storage for use during registration
    localStorage.setItem('auth_id', authId);
});

async function populateCountryDropdown() {
    const container = document.getElementById('countryDropdown');
    const toggle = document.getElementById('dropdownToggle');
    const searchInput = document.getElementById('countrySearch');
    const list = document.getElementById('dropdownList');
    const hiddenInput = document.getElementById('countryCode');

    let countryItems = [];

    try {
        // Try the API with the correct fields
        let response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
        let countries;
        if (response.ok) {
            countries = await response.json();
        } else {
            // Fallback to local file
            response = await fetch('countries.json');
            if (!response.ok) throw new Error('Both remote and local country list failed');
            countries = await response.json();
        }

        if (!Array.isArray(countries)) throw new Error('Countries API did not return an array');
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

        countryItems = countries.filter(country =>
            country.idd && country.idd.root && country.idd.suffixes && country.idd.suffixes.length > 0
        ).map(country => {
            const code = country.cca2;
            const name = country.name.common;
            const callingCode = country.idd.root + country.idd.suffixes[0];
            const flagUrl = country.flags.png;

            const li = document.createElement('li');
            li.innerHTML = `<img src="${flagUrl}" alt="${name}" width="24" height="16"> ${name} (${callingCode})`;
            li.addEventListener('click', () => {
                toggle.innerHTML = `<img src="${flagUrl}" alt="${name}" width="24" height="16"> ${name} (${callingCode})`;
                list.classList.remove('show');
                hiddenInput.value = code;
                searchInput.value = '';
                filterCountries('');
            });
            return { element: li, name: name.toLowerCase() };
        });

        countryItems.forEach(item => list.appendChild(item.element));

        const filterCountries = (searchValue) => {
            list.querySelectorAll('li:not(.search-box)').forEach(li => li.remove());
            countryItems
                .filter(item => item.name.includes(searchValue))
                .forEach(item => list.appendChild(item.element));
        };

        searchInput.addEventListener('input', () => {
            filterCountries(searchInput.value.toLowerCase());
        });

        toggle.addEventListener('click', () => {
            list.classList.toggle('show');
            if (list.classList.contains('show')) {
                searchInput.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) list.classList.remove('show');
        });

    } catch (err) {
        console.error('❌ Failed to load country list:', err);
    }
}


document.addEventListener('DOMContentLoaded', populateCountryDropdown);

const registerForm = document.getElementById('registerForm');
const registerResponseMessage = document.getElementById('registerResponseMessage');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const countrySelect = document.getElementById('countryCode');

if (!registerForm) {
    console.error('❌ registerForm element not found in the DOM.');
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const country = countrySelect.value; // ISO code, e.g. 'NG'
    let phoneNumberInput = document.getElementById('phoneNumber').value.trim();
    registerResponseMessage.textContent = '';
    registerResponseMessage.classList.remove('error', 'success');

    // Normalize input: if it starts with country code but not +, add +
    if (!phoneNumberInput.startsWith('+')) {
        try {
            const phoneObj = parsePhoneNumberFromString(phoneNumberInput, country);
            console.log(`📞 Parsed phone number:`, phoneObj); // Debug log
            if (!phoneObj || !phoneObj.isValid()) {
                throw new Error('Invalid');
            }
            phoneNumberInput = phoneObj.number;
        } catch (e) {
            registerResponseMessage.textContent = '❌ Invalid phone number format.';
            registerResponseMessage.classList.add('error');
            return;
        }
    }

    let phoneNumber;
    try {
        // If input starts with +, country is optional
        if (phoneNumberInput.startsWith('+')) {
            phoneNumber = parsePhoneNumberFromString(phoneNumberInput);
        } else {
            phoneNumber = parsePhoneNumberFromString(phoneNumberInput, country);
        }
        console.log(`📞 Parsed phone number:`, phoneNumber);
    } catch (err) {
        registerResponseMessage.textContent = '❌ Invalid phone number format.';
        registerResponseMessage.classList.add('error');
        return;
    }

    if (!phoneNumber || !phoneNumber.isValid()) {
        registerResponseMessage.textContent = '❌ Please enter a valid phone number for the selected country.';
        registerResponseMessage.classList.add('error');
        return;
    }

    // Format to E.164 and remove the +
    const formattedNumber = phoneNumber.number.replace(/^\+/, '');
    console.log(`📞 Formatted phone number: ${formattedNumber}`);
    const authId = localStorage.getItem('auth_id'); // Retrieve auth_id from local storage
    console.log('🔍 Retrieved auth_id from local storage:', authId);
    socket.emit('authId', authId);

    lastFormattedNumber = formattedNumber;
    lastAuthId = authId;

    if (!authId) {
        console.error('❌ Auth ID is missing. Please log in again.');
        registerResponseMessage.textContent = '❌ Auth ID is missing. Please log in again.';
        registerResponseMessage.classList.add('error');
        return;
    }

    console.log(`📥 Registering bot with phone number: ${phoneNumber.number}, auth_id: ${authId}`); // Debug log

    try {
        // Validate the token before proceeding
        const tokenValidationResponse = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ authId }),
        });

        const tokenValidationData = await tokenValidationResponse.json();

        if (!tokenValidationResponse.ok) {
            console.error(`❌ Token validation failed: ${tokenValidationData.message}`);
            registerResponseMessage.textContent = `❌ ${tokenValidationData.message}`;
            registerResponseMessage.classList.add('error');

            // Send notification to the user
            await sendNotification(
                'Your token is invalid or expired. Please contact the developer to renew your token.',
                authId
            );
            return;
        }

        console.log('✅ Token validated successfully.');
        const pairingMethod = document.querySelector('input[name="pairingMethod"]:checked').value;
        console.log(`🔍 Pairing method selected: ${pairingMethod}`); // Debug log

        // Proceed with bot registration
        console.log(`📥 Sending registration request for phone number: ${formattedNumber}, auth_id: ${authId}, pairingMethod: ${pairingMethod}`); // Debug log
        const registrationResponse = await fetch(`${API_BASE_URL}/api/start-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber: formattedNumber, authId, pairingMethod })
        });

        const registrationData = await registrationResponse.json();

        if (registrationResponse.ok) {
            console.log('✅ Bot registered successfully:', registrationData);
            registerResponseMessage.textContent = '✅ Bot registered successfully! Waiting for QR code...';
            registerResponseMessage.classList.add('success');
        } else {
            // Prefer 'error' field, fallback to 'message'
            const errorMsg =
                registrationData.error ||
                registrationData.details ||
                registrationData.message ||
                'Unknown error';
            console.error(`❌ Bot registration failed: ${errorMsg}`);
            registerResponseMessage.textContent = `❌ ${errorMsg}`;
            registerResponseMessage.classList.add('error');

            // Send notification to the user
            await sendNotification(
                `Failed to register bot for phone number ${phoneNumber}: ${errorMsg}`,
                authId
            );
        }
    } catch (error) {
        console.error('❌ Error during bot registration:', error.message);
        registerResponseMessage.textContent = '❌ Error registering bot. Please try again later.';
        registerResponseMessage.classList.add('error');

        // Send notification to the user
        await sendNotification('An error occurred during bot registration. Please try again later.', authId);
    }
});

/**
 * Send a notification to the user.
 * @param {string} message - The notification message.
 * @param {string} authId - The user's Auth ID.
 */
const sendNotification = async (message, authId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, authId }),
        });

        if (response.ok) {
            console.log('✅ Notification sent successfully.');
        } else {
            console.error('❌ Failed to send notification.');
        }
    } catch (error) {
        console.error('❌ Error sending notification:', error.message);
    }
};

socket.on('qr', (data) => {
    if (data && data.pairingCode) {
        qrCodeContainer.innerHTML = `
            <div class="pairing-code-box">
                <h3>WhatsApp Pairing Code</h3>
                <div class="pairing-code" id="pairingCode">${data.pairingCode}</div>
                <p>
                    1. Open WhatsApp on your phone.<br>
                    2. Tap <b>Menu</b> (or <b>Settings</b>) &gt; <b>Linked Devices</b>.<br>
                    3. Tap <b>Link a device</b>.<br>
                    4. Enter this code: <span id="pairingCodeValue">${data.pairingCode}</span>
                </p>
                <button id="requestNewCodeBtn" class="btn-primary">Request New Code</button>
                <button id="cancelDeployBtn" class="btn-danger">Cancel Deployment</button>
            </div>
        `;
        registerResponseMessage.textContent = '🔑 Enter this code in WhatsApp!';
        document.getElementById('requestNewCodeBtn').onclick = async () => {
            const pairingMethod = document.querySelector('input[name="pairingMethod"]:checked').value;
            registerResponseMessage.textContent = '⏳ Requesting new code...';
            if (pairingMethod === 'pairingCode') {
                socket.emit('request-new-code', { phoneNumber: lastFormattedNumber, authId: lastAuthId, pairingMethod: 'pairingCode' });
            } else {
                registerResponseMessage.textContent = '❌ Request New Code is only available for Pairing Code method.';
            }
        };
    } else if (data && data.qr) {
        let qrImg = document.getElementById('qrImage');
        if (!qrImg) {
            qrImg = document.createElement('img');
            qrImg.id = 'qrImage';
            qrImg.alt = 'QR Code';
            qrImg.style.display = 'block';
            qrCodeContainer.innerHTML = '';
            qrCodeContainer.appendChild(qrImg);
        }
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data.qr)}&size=250x250`;
        registerResponseMessage.textContent = '📱 Scan the QR code with WhatsApp!';
        // Add the cancel button for QR code as well
        qrCodeContainer.innerHTML += `<button id="cancelDeployBtn" class="btn-danger">Cancel Deployment</button>`;
    } else {
        registerResponseMessage.textContent = '❌ Failed to receive pairing code or QR code.';
    }

    // Attach cancel handler (works for both pairing code and QR code)
    const cancelBtn = document.getElementById('cancelDeployBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            socket.emit('cancel-deployment', { phoneNumber: lastFormattedNumber, authId: lastAuthId });
            registerResponseMessage.textContent = '⏹️ Deployment cancelled.';
            qrCodeContainer.innerHTML = '';
        };
    }
});

// After rendering the QR or pairing code:
qrCodeContainer.innerHTML += `<button id="cancelDeployBtn" class="btn-danger">Cancel Deployment</button>`;

document.getElementById('cancelDeployBtn').onclick = () => {
    socket.emit('cancel-deployment', { phoneNumber: lastFormattedNumber, authId: lastAuthId });
    registerResponseMessage.textContent = '⏹️ Deployment cancelled.';
    qrCodeContainer.innerHTML = '';
};

// Also cancel if user leaves the page before completing deployment
window.addEventListener('beforeunload', () => {
    if (lastFormattedNumber && lastAuthId) {
        // Try socket emit (may not always work)
        socket.emit('cancel-deployment', { phoneNumber: lastFormattedNumber, authId: lastAuthId });

        // Fallback: Use sendBeacon for reliability
        const url = `${API_BASE_URL}/api/cancel-deployment`;
        const data = JSON.stringify({ phoneNumber: lastFormattedNumber, authId: lastAuthId });
        navigator.sendBeacon(url, data);
    }
});

// Listen for registration status updates
socket.on('registration-status', (data) => {
    const { status, message } = data;

    console.log(`📣 Registration status: ${status} - ${message}`);

    registerResponseMessage.textContent = message;
    registerResponseMessage.classList.remove('success', 'error');
    registerResponseMessage.classList.add(status === 'success' ? 'success' : 'error');

    if (status === 'success') {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }
});

socket.on('qr-clear', (data) => {
    console.log(`🧹 Clearing QR code`);

    // Clear the QR code container
    qrCodeContainer.innerHTML = '';
});

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumber = urlParams.get('phoneNumber');

    if (phoneNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/rescan-qr/${phoneNumber}`);
            const data = await response.json();

            if (response.ok) {
                const qrCodeContainer = document.getElementById('qrCodeContainer');
                qrCodeContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
            } else {
                console.error('❌ Failed to fetch QR code:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching QR code:', error.message);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const platformSelect = document.getElementById('platform');
    if (platformSelect) {
        // Restore last selected platform if available
        const lastPlatform = localStorage.getItem('last_platform');
        if (lastPlatform) {
            platformSelect.value = lastPlatform;
        }
        function updatePlatformColor() {
            const selected = platformSelect.options[platformSelect.selectedIndex];
            const color = selected.getAttribute('data-color') || '#181828';
            platformSelect.style.backgroundColor = color;
            platformSelect.style.color = '#fff';
        }
        platformSelect.addEventListener('change', updatePlatformColor);
        updatePlatformColor(); // Set initial color
    }
});