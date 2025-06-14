require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const setupWebSocket = require('./websocket');
// const setupSwagger = require('./swagger');
const { swaggerUi, swaggerSpec } = require('./swagger');

const websocketDocRoute = require('./routes/websocket-doc');
const messageRoute = require('./routes/message');
const userRoutes = require('./routes/users');
const app = express();
// app.use(cors());
app.use(cors({
  origin: '*', // Or replace * with your frontend URL like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', websocketDocRoute);
app.use('/api/messages', messageRoute);
app.use('/api/users', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// setupSwagger(app);
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const server = http.createServer(app);
setupWebSocket(server);
server.listen(5000, () => console.log('Server running on http://localhost:5000'));
