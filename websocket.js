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

    console.log('📡 New WebSocket connection');

    // Authenticate
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`✅ Authenticated user: ${user.username} (${user.id})`);
    } catch (err) {
      console.error('❌ Invalid token');
      return ws.close();
    }

    ws.user = user;
    ws.room = room || null;

    if (room) {
      console.log(`🧑‍🤝‍🧑 User ${user.username} joined room: ${room}`);

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

    // ws.on('message', async (raw) => {
    //   console.log(`📨 Raw message from ${user.username}:`, raw);

    //   let data;
    //   try {
    //     data = JSON.parse(raw);
    //   } catch (err) {
    //     console.error('❌ Invalid JSON message');
    //     return;
    //   }

    //   const { message, toUserId } = data;
    //   if (!message) return;

    //   const senderId = user.id;

    //   // 1-to-1 Message
    //   if (toUserId) {
    //     console.log(`📩 Private message from ${user.username} to userId: ${toUserId}`);

    //     const receiver = await User.findById(toUserId);
    //     if (!receiver) {
    //       console.warn(`⚠️ Receiver not found: ${toUserId}`);
    //       return;
    //     }

    //     const newMsg = await Message.create({
    //       sender: senderId,
    //       receiver: toUserId,
    //       content: message
    //     });

    //     wss.clients.forEach((client) => {
    //       if (
    //         client.readyState === WebSocket.OPEN &&
    //         (client.user.id === toUserId || client.user.id === senderId)
    //       ) {
    //         client.send(JSON.stringify({
    //           from: user.username,
    //           to: receiver.username,
    //           content: message,
    //           timestamp: newMsg.timestamp,
    //           type: 'private'
    //         }));
    //       }
    //     });

    //     console.log(`✅ Message sent to ${receiver.username}`);
    //   }

    //   // Group Message
    //   else if (room) {
    //     console.log(`💬 Group message in room ${room} by ${user.username}: ${message}`);

    //     const newMsg = await Message.create({
    //       sender: senderId,
    //       room,
    //       content: message
    //     });

    //     wss.clients.forEach((client) => {
    //       if (
    //         client.readyState === WebSocket.OPEN &&
    //         client.room === room
    //       ) {
    //         client.send(JSON.stringify({
    //           from: user.username,
    //           content: message,
    //           timestamp: newMsg.timestamp,
    //           type: 'group'
    //         }));
    //       }
    //     });

    //     console.log(`✅ Group message broadcasted in room: ${room}`);
    //   }
    // });


    
ws.on('message', async (raw) => {
  console.log(`📨 Raw message from ${user.username}:`, raw);

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Invalid JSON message');
    return;
  }

  const { message, toUserId, fileAttachment, messageType = 'text' } = data;
  
  // Validate that we have either message content or file attachment
  if (!message && !fileAttachment) return;

  const senderId = user.id;

  // 1-to-1 Message (including file messages)
  if (toUserId) {
    console.log(`📩 Private message from ${user.username} to userId: ${toUserId}`);

    const receiver = await User.findById(toUserId);
    if (!receiver) {
      console.warn(`⚠️ Receiver not found: ${toUserId}`);
      return;
    }

    // Create message with file attachment support
    const messageData = {
      sender: senderId,
      receiver: toUserId,
      content: message || '', // Can be empty for file-only messages
      messageType: messageType,
      timestamp: new Date()
    };

    // Add file attachment if present
    if (fileAttachment) {
      messageData.fileAttachment = fileAttachment;
    }

    const newMsg = await Message.create(messageData);

    // Broadcast to both sender and receiver
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (client.user.id === toUserId || client.user.id === senderId)
      ) {
        const broadcastMessage = {
          from: user.username,
          to: receiver.username,
          content: message || '',
          messageType: messageType,
          fileAttachment: fileAttachment,
          timestamp: newMsg.timestamp,
          type: 'private'
        };

        client.send(JSON.stringify(broadcastMessage));
      }
    });

    console.log(`✅ Message sent to ${receiver.username}`);
  }

  // Group Message (you can add similar file support for groups)
  else if (room) {
    console.log(`💬 Group message in room ${room} by ${user.username}`);

    const messageData = {
      sender: senderId,
      room,
      content: message || '',
      messageType: messageType,
      timestamp: new Date()
    };

    if (fileAttachment) {
      messageData.fileAttachment = fileAttachment;
    }

    const newMsg = await Message.create(messageData);

    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.room === room
      ) {
        const broadcastMessage = {
          from: user.username,
          content: message || '',
          messageType: messageType,
          fileAttachment: fileAttachment,
          timestamp: newMsg.timestamp,
          type: 'group'
        };

        client.send(JSON.stringify(broadcastMessage));
      }
    });

    console.log(`✅ Group message broadcasted in room: ${room}`);
  }
});
    ws.on('close', () => {
      console.log(`🔌 WebSocket closed: ${user?.username}`);
    });
  });
}

module.exports = setupWebSocket;







