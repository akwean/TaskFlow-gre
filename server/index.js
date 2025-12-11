const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { initSocket } = require('./realtime/socket');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

app.use(express.json());
// Trust Render/Proxy for correct protocol detection
app.set('trust proxy', 1);

// CORS: allow configured client origin(s). In development also permit
// common localhost variants (127.0.0.1) to avoid dev-origin mismatches.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        // allow same-origin and non-browser requests (e.g. curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow explicit configured origins
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // In non-production, accept common localhost variants to avoid Vite/host mismatches
        if (process.env.NODE_ENV !== 'production') {
            try {
                const url = new URL(origin);
                const host = url.hostname;
                if (host === 'localhost' || host === '127.0.0.1') {
                    return callback(null, true);
                }
            } catch (e) {
                // malformed origin - fall through to deny
            }
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(helmet());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}
app.use(compression());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/boards/:boardId/lists', require('./routes/lists'));
app.use('/api/lists/:listId/cards', require('./routes/cards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/cards', require('./routes/cards'));

// Healthcheck for Render
app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve frontend in production if built into server/client/dist
if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, '..', 'client', 'dist');
    const indexFile = path.join(distDir, 'index.html');
    if (fs.existsSync(indexFile)) {
        app.use(express.static(distDir));
        // Fallback to index.html for SPA routes; exclude API via regex
        app.get(/^\/(?!api).*$/, (req, res) => {
            res.sendFile(indexFile);
        });
    } else {
        // If the static build isn't present, skip static serving to avoid ENOENT errors.
        console.warn('Static client not found at', indexFile, '- skipping static serving.');
        app.get('/', (req, res) => {
            res.send('API is running...');
        });
    }
} else {
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO after routes/middleware
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
