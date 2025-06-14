/**
 * @swagger
 * /api/messages/group/{room}:
 *   get:
 *     summary: Get message history for a group room
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: room
 *         required: true
 *         schema:
 *           type: string
 *         description: Group room name
 *     responses:
 *       200:
 *         description: List of messages
 */

/**
 * @swagger
 * /api/messages/private/{userId}:
 *   get:
 *     summary: Get 1-to-1 chat history with a specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receiver user ID
 *     responses:
 *       200:
 *         description: List of messages
 */


const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/messages/group/:room
 * Fetch group chat history
 */
router.get('/group/:room', authMiddleware, async (req, res) => {
  const { room } = req.params;
  const messages = await Message.find({ room })
    .sort({ timestamp: 1 })
    .populate('sender', 'username');
  res.json(messages);
});

/**
 * GET /api/messages/private/:userId
 * Fetch private chat history with another user
 */
router.get('/private/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const myId = req.user.id;

  const messages = await Message.find({
    $or: [
      { sender: myId, receiver: userId },
      { sender: userId, receiver: myId }
    ]
  })
    .sort({ timestamp: 1 })
    .populate('sender', 'username')
    .populate('receiver', 'username');

  res.json(messages);
});

module.exports = router;
