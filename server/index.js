const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/db');
const { initSocket } = require('./realtime/socket');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());
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

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO after routes/middleware
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
