//const URL = 'http://localhost:4001';
const URL = 'https://lm-bp8r.onrender.com';
//const URL = 'http://89.168.114.68:4001';
//const URL = 'https://load-manager.fly.dev';


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