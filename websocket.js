// setupWebSocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const room = url.searchParams.get('room'); // optional for 1-to-1
    let user;

    // Authenticate
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return ws.close();
    }

    // Attach user and room
    ws.user = user;
    ws.room = room || null;

    // For group chat: send last 50 messages
    if (room) {
      const messages = await Message.find({ room }).sort({ timestamp: 1 }).limit(50).populate('sender', 'username');
      messages.forEach((msg) => {
        ws.send(JSON.stringify({
          from: msg.sender.username,
          content: msg.content,
          timestamp: msg.timestamp,
          type: 'group',
        }));
      });
    }

    ws.on('message', async (raw) => {
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        return;
      }

      const { message, toUserId } = data;

      if (!message) return;

      const senderId = user.id;

      // 1-to-1 message
      if (toUserId) {
        const receiver = await User.findById(toUserId);
        if (!receiver) return;

        const newMsg = await Message.create({
          sender: senderId,
          receiver: toUserId,
          content: message
        });

        // Send to sender and receiver
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            (client.user.id === toUserId || client.user.id === senderId)
          ) {
            client.send(JSON.stringify({
              from: user.username,
              to: receiver.username,
              content: message,
              timestamp: newMsg.timestamp,
              type: 'private'
            }));
          }
        });
      }

      // Group message
      else if (room) {
        const newMsg = await Message.create({
          sender: senderId,
          room,
          content: message
        });

        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.room === room
          ) {
            client.send(JSON.stringify({
              from: user.username,
              content: message,
              timestamp: newMsg.timestamp,
              type: 'group'
            }));
          }
        });
      }
    });
  });
}

module.exports = setupWebSocket;
