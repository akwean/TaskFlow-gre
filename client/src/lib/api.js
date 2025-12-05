import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Simple offline queue for mutations
const queue = [];
let online = true;

function processQueue() {
    if (!online) return;
    while (queue.length) {
        const { method, url, data, resolve, reject } = queue.shift();
        api[method](url, data).then(resolve).catch(reject);
    }
}

export function setOnlineState(state) {
    online = state;
    if (online) processQueue();
}

export function queuedPut(url, data) {
    return new Promise((resolve, reject) => {
        if (online) {
            api.put(url, data).then(resolve).catch(reject);
        } else {
            queue.push({ method: 'put', url, data, resolve, reject });
        }
    });
}

export default api;
