// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs-extra');
const Message = require('../models/Message');

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a file for chat
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               toUserId:
 *                 type: string
 *                 description: Recipient user ID (for private messages)
 *               room:
 *                 type: string
 *                 description: Room name (for group messages)
 *               message:
 *                 type: string
 *                 description: Optional text message to accompany the file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 file:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                     size:
 *                       type: number
 *                     url:
 *                       type: string
 *       400:
 *         description: Bad request - no file uploaded or invalid file type
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine message type based on file MIME type
    const getMessageType = (mimetype) => {
      if (mimetype.startsWith('image/')) return 'image';
      if (mimetype.startsWith('video/')) return 'video';
      if (mimetype.startsWith('audio/')) return 'audio';
      if (mimetype.includes('pdf') || 
          mimetype.includes('document') || 
          mimetype.includes('text') ||
          mimetype.includes('spreadsheet') ||
          mimetype.includes('presentation')) return 'document';
      return 'file';
    };

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/api/files/download/${req.file.filename}`,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    const messageType = getMessageType(req.file.mimetype);

    // Optional: Save as message if toUserId or room is provided
    const { toUserId, room, message: textMessage } = req.body;
    
    if (toUserId || room) {
      const messageData = {
        sender: req.user.id,
        content: textMessage || '',
        messageType: messageType,
        fileAttachment: {
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          mimetype: fileInfo.mimetype,
          size: fileInfo.size,
          url: fileInfo.url,
          uploadedAt: fileInfo.uploadedAt
        }
      };

      // Add recipient info
      if (toUserId) {
        messageData.receiver = toUserId;
      }
      if (room) {
        messageData.room = room;
      }

      await Message.create(messageData);
    }

    res.json({
      message: 'File uploaded successfully',
      file: fileInfo,
      messageType: messageType
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up file if it was uploaded but processing failed
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'File upload failed' });
  }
});

/**
 * @swagger
 * /api/files/download/{filename}:
 *   get:
 *     summary: Download/view uploaded file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename to download
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename (prevent directory traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    
    // Try to set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.zip': 'application/zip'
    };
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
    
    // For images, videos, audio, and PDFs, allow inline viewing
    const inlineTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp3', '.wav', '.mp4', '.webm'];
    if (inlineTypes.includes(ext)) {
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
    }
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read file' });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

/**
 * @swagger
 * /api/files/info/{filename}:
 *   get:
 *     summary: Get file information
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: number
 *                 created:
 *                   type: string
 *                   format: date-time
 *                 modified:
 *                   type: string
 *                   format: date-time
 *                 mimetype:
 *                   type: string
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/info/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    
    // Try to determine MIME type from extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.zip': 'application/zip'
    };
    
    res.json({
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      mimetype: mimeTypes[ext] || 'application/octet-stream',
      extension: ext,
      downloadUrl: `/api/files/download/${filename}`
    });
    
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

/**
 * @swagger
 * /api/files/delete/{filename}:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       403:
 *         description: Unauthorized to delete this file
 *       500:
 *         description: Server error
 */
router.delete('/delete/:filename', authMiddleware, async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // Check if user has permission to delete this file
    // You might want to check if the file belongs to the user or if they have admin rights
    const message = await Message.findOne({
      'fileAttachment.filename': filename,
      sender: req.user.id
    });
    
    if (!message) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }
    
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete the file
    await fs.unlink(filePath);
    
    // Optionally, mark the message as having a deleted file
    message.fileAttachment = null;
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

/**
 * @swagger
 * /api/files/list:
 *   get:
 *     summary: List user's uploaded files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, audio, document, file]
 *     responses:
 *       200:
 *         description: List of user's files
 *       500:
 *         description: Server error
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {
      sender: req.user.id,
      fileAttachment: { $exists: true, $ne: null },
      isDeleted: false
    };
    
    if (type) {
      query.messageType = type;
    }
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('fileAttachment messageType timestamp');
    
    const totalCount = await Message.countDocuments(query);
    
    const files = messages.map(msg => ({
      filename: msg.fileAttachment.filename,
      originalName: msg.fileAttachment.originalName,
      mimetype: msg.fileAttachment.mimetype,
      size: msg.fileAttachment.size,
      url: msg.fileAttachment.url,
      messageType: msg.messageType,
      uploadedAt: msg.timestamp
    }));
    
    res.json({
      files,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: 'Failed to get file list' });
  }
});

module.exports = router;