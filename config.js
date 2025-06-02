const URL = 'http://localhost:4001';
//const URL = 'https://load-manager-production.up.railway.app';
console.log(`Connecting to LM at ${URL}/bot-server`);

const API_BASE_URL = URL;
const SOCKET_BASE_URL = URL;

export { API_BASE_URL, SOCKET_BASE_URL };

export function createSocket() {
    return io(SOCKET_BASE_URL, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
}