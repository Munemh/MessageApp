// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Basic message info
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // For 1-to-1 messages
  room: { 
    type: String 
  }, // For group messages
  content: { 
    type: String, 
    default: '' 
  }, // Text content (optional for file-only messages)
  
  // File attachment fields
  fileAttachment: {
    filename: { type: String }, // Unique filename on server
    originalName: { type: String }, // Original filename from user
    mimetype: { type: String }, // File MIME type
    size: { type: Number }, // File size in bytes
    url: { type: String }, // Download URL
    uploadedAt: { type: Date, default: Date.now }
  },
  
  // Message type classification
  messageType: { 
    type: String, 
    enum: ['text', 'file', 'image', 'audio', 'video', 'document'],
    default: 'text'
  },
  
  // Status fields
  isRead: { 
    type: Boolean, 
    default: false 
  },
  isDelivered: { 
    type: Boolean, 
    default: false 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  
  // Timestamps
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  editedAt: { 
    type: Date 
  },
  deletedAt: { 
    type: Date 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better query performance
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ timestamp: -1 });

// Virtual for determining if message is private or group
messageSchema.virtual('isPrivate').get(function() {
  return !!this.receiver;
});

messageSchema.virtual('isGroup').get(function() {
  return !!this.room;
});

// Method to get file type category
messageSchema.methods.getFileCategory = function() {
  if (!this.fileAttachment || !this.fileAttachment.mimetype) {
    return 'unknown';
  }
  
  const mimetype = this.fileAttachment.mimetype.toLowerCase();
  
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

// Method to format file size
messageSchema.methods.getFormattedFileSize = function() {
  if (!this.fileAttachment || !this.fileAttachment.size) {
    return '0 B';
  }
  
  const bytes = this.fileAttachment.size;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Static method to find conversation between two users
messageSchema.statics.findConversation = function(userId1, userId2, limit = 50) {
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ],
    isDeleted: false
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('sender', 'username email')
  .populate('receiver', 'username email');
};

// Static method to find room messages
messageSchema.statics.findRoomMessages = function(roomName, limit = 50) {
  return this.find({
    room: roomName,
    isDeleted: false
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('sender', 'username email');
};

module.exports = mongoose.model('Message', messageSchema);