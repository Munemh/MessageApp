const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /websocket-guide:
 *   get:
 *     summary: WebSocket Usage Guide
 *     description: >
 *       Connect to `ws://localhost:5000` using WebSocket.<br />
 *       <br />
 *       **Join a room:**
 *       ```json
 *       {
 *         "type": "join",
 *         "room": "room1",
 *         "token": "your_jwt_token"
 *       }
 *       ```
 *       <br />
 *       **Send a message:**
 *       ```json
 *       {
 *         "type": "message",
 *         "room": "room1",
 *         "message": "Hello!"
 *       }
 *       ```
 *       <br />
 *       **Receive a broadcast:**
 *       ```json
 *       {
 *         "type": "message",
 *         "from": "username",
 *         "message": "Hello!",
 *         "room": "room1",
 *         "timestamp": "2025-06-13T12:00:00Z"
 *       }
 *       ```
 *     tags:
 *       - WebSocket
 *     responses:
 *       200:
 *         description: WebSocket guide displayed successfully
 */
router.get('/websocket-guide', (req, res) => {
  res.send('Check Swagger UI for WebSocket usage guide.');
});

module.exports = router;
