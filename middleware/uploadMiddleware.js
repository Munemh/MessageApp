// // // middleware/uploadMiddleware.js
// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs-extra');

// // // Ensure uploads directory exists
// // const uploadsDir = path.join(__dirname, '../uploads');
// // fs.ensureDirSync(uploadsDir);

// // // Configure storage
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, uploadsDir);
// //   },
// //   filename: function (req, file, cb) {
// //     // Generate unique filename: timestamp-originalname
// //     const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
// //     cb(null, uniqueName);
// //   }
// // });

// // // File filter function
// // const fileFilter = (req, file, cb) => {
// //   // Define allowed file types
// //   const allowedTypes = {
// //     // Images
// //     'image/jpeg': 'jpg',
// //     'image/jpg': 'jpg', 
// //     'image/png': 'png',
// //     'image/gif': 'gif',
// //     'image/webp': 'webp',
    
// //     // Documents
// //     'application/pdf': 'pdf',
// //     'application/msword': 'doc',
// //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
// //     'application/vnd.ms-excel': 'xls',
// //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
// //     'application/vnd.ms-powerpoint': 'ppt',
// //     'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
// //     'text/plain': 'txt',
    
// //     // Audio
// //     'audio/mpeg': 'mp3',
// //     'audio/wav': 'wav',
// //     'audio/ogg': 'ogg',
// //     'audio/mp4': 'm4a',
// //     'audio/webm': 'webm',
    
// //     // Video
// //     'video/mp4': 'mp4',
// //     'video/mpeg': 'mpeg',
// //     'video/quicktime': 'mov',
// //     'video/x-msvideo': 'avi',
// //     'video/webm': 'webm',
    
// //     // Archives
// //     'application/zip': 'zip',
// //     'application/x-rar-compressed': 'rar',
// //     'application/x-7z-compressed': '7z'
// //   };

// //   if (allowedTypes[file.mimetype]) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error(`File type ${file.mimetype} not allowed`), false);
// //   }
// // };

// // const upload = multer({
// //   storage: storage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 50 * 1024 * 1024, // 50MB limit
// //   },
// // });

// // module.exports = upload;

// // // routes/fileRoutes.js
// // const express = require('express');
// // const router = express.Router();
// // const upload = require('../middleware/uploadMiddleware');
// // const authMiddleware = require('../middleware/authMiddleware');
// // const path = require('path');
// // const fs = require('fs-extra');

// // /**
// //  * @swagger
// //  * /api/files/upload:
// //  *   post:
// //  *     summary: Upload a file for chat
// //  *     tags: [Files]
// //  *     security:
// //  *       - bearerAuth: []
// //  *     requestBody:
// //  *       content:
// //  *         multipart/form-data:
// //  *           schema:
// //  *             type: object
// //  *             properties:
// //  *               file:
// //  *                 type: string
// //  *                 format: binary
// //  *               toUserId:
// //  *                 type: string
// //  *                 description: Recipient user ID (for private messages)
// //  *               room:
// //  *                 type: string
// //  *                 description: Room name (for group messages)
// //  *     responses:
// //  *       200:
// //  *         description: File uploaded successfully
// //  */
// // router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({ error: 'No file uploaded' });
// //     }

// //     const fileInfo = {
// //       filename: req.file.filename,
// //       originalName: req.file.originalname,
// //       mimetype: req.file.mimetype,
// //       size: req.file.size,
// //       path: req.file.path,
// //       url: `/api/files/download/${req.file.filename}`,
// //       uploadedBy: req.user.id,
// //       uploadedAt: new Date()
// //     };

// //     res.json({
// //       message: 'File uploaded successfully',
// //       file: fileInfo
// //     });
// //   } catch (error) {
// //     console.error('File upload error:', error);
// //     res.status(500).json({ error: 'File upload failed' });
// //   }
// // });

// // /**
// //  * @swagger
// //  * /api/files/download/{filename}:
// //  *   get:
// //  *     summary: Download/view uploaded file
// //  *     tags: [Files]
// //  *     parameters:
// //  *       - in: path
// //  *         name: filename
// //  *         required: true
// //  *         schema:
// //  *           type: string
// //  *     responses:
// //  *       200:
// //  *         description: File content
// //  */
// // router.get('/download/:filename', (req, res) => {
// //   try {
// //     const filename = req.params.filename;
// //     const filePath = path.join(__dirname, '../uploads', filename);
    
// //     // Check if file exists
// //     if (!fs.existsSync(filePath)) {
// //       return res.status(404).json({ error: 'File not found' });
// //     }

// //     // Get file stats
// //     const stats = fs.statSync(filePath);
    
// //     // Set appropriate headers
// //     res.setHeader('Content-Length', stats.size);
    
// //     // Create read stream and pipe to response
// //     const fileStream = fs.createReadStream(filePath);
// //     fileStream.pipe(res);
    
// //   } catch (error) {
// //     console.error('File download error:', error);
// //     res.status(500).json({ error: 'File download failed' });
// //   }
// // });

// // /**
// //  * @swagger
// //  * /api/files/info/{filename}:
// //  *   get:
// //  *     summary: Get file information
// //  *     tags: [Files]
// //  *     parameters:
// //  *       - in: path
// //  *         name: filename
// //  *         required: true
// //  *         schema:
// //  *           type: string
// //  *     responses:
// //  *       200:
// //  *         description: File information
// //  */
// // router.get('/info/:filename', (req, res) => {
// //   try {
// //     const filename = req.params.filename;
// //     const filePath = path.join(__dirname, '../uploads', filename);
    
// //     if (!fs.existsSync(filePath)) {
// //       return res.status(404).json({ error: 'File not found' });
// //     }

// //     const stats = fs.statSync(filePath);
    
// //     res.json({
// //       filename,
// //       size: stats.size,
// //       created: stats.birthtime,
// //       modified: stats.mtime
// //     });
    
// //   } catch (error) {
// //     console.error('File info error:', error);
// //     res.status(500).json({ error: 'Failed to get file info' });
// //   }
// // });

// // module.exports = router;

// // // Update your Message model to support file attachments
// // // models/Message.js (add these fields)
// // const messageSchema = new mongoose.Schema({
// //   sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// //   receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// //   room: { type: String },
// //   content: { type: String }, // Make this optional since files can be sent without text
  
// //   // File attachment fields
// //   fileAttachment: {
// //     filename: String,
// //     originalName: String,
// //     mimetype: String,
// //     size: Number,
// //     url: String
// //   },
  
// //   messageType: { 
// //     type: String, 
// //     enum: ['text', 'file', 'image', 'audio', 'video', 'document'],
// //     default: 'text'
// //   },
  
// //   timestamp: { type: Date, default: Date.now }
// // });

// // // Don't forget to register the file routes in your main app.js
// // // app.use('/api/files', require('./routes/fileRoutes'));


// // middleware/uploadMiddleware.js
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs-extra');
// const crypto = require('crypto');

// // Ensure uploads directory exists
// const uploadsDir = path.join(__dirname, '../uploads');
// fs.ensureDirSync(uploadsDir);

// // Configure storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     // Generate unique filename using crypto for better uniqueness
//     const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
//     const extension = path.extname(file.originalname);
//     const baseName = path.basename(file.originalname, extension);
    
//     // Sanitize filename
//     const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_');
//     const uniqueName = `${sanitizedBaseName}-${uniqueSuffix}${extension}`;
    
//     cb(null, uniqueName);
//   }
// });

// // File filter function
// const fileFilter = (req, file, cb) => {
//   // Define allowed file types with their extensions
//   const allowedTypes = {
//     // Images
//     'image/jpeg': ['jpg', 'jpeg'],
//     'image/jpg': ['jpg'], 
//     'image/png': ['png'],
//     'image/gif': ['gif'],
//     'image/webp': ['webp'],
//     'image/bmp': ['bmp'],
//     'image/tiff': ['tiff', 'tif'],
//     'image/svg+xml': ['svg'],
    
//     // Documents
//     'application/pdf': ['pdf'],
//     'application/msword': ['doc'],
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
//     'application/vnd.ms-excel': ['xls'],
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
//     'application/vnd.ms-powerpoint': ['ppt'],
//     'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
//     'text/plain': ['txt'],
//     'text/csv': ['csv'],
//     'application/rtf': ['rtf'],
//     'application/vnd.oasis.opendocument.text': ['odt'],
    
//     // Audio
//     'audio/mpeg': ['mp3'],
//     'audio/wav': ['wav'],
//     'audio/ogg': ['ogg'],
//     'audio/mp4': ['m4a'],
//     'audio/webm': ['webm'],
//     'audio/aac': ['aac'],
//     'audio/flac': ['flac'],
//     'audio/x-ms-wma': ['wma'],
    
//     // Video
//     'video/mp4': ['mp4'],
//     'video/mpeg': ['mpeg', 'mpg'],
//     'video/quicktime': ['mov'],
//     'video/x-msvideo': ['avi'],
//     'video/webm': ['webm'],
//     'video/x-flv': ['flv'],
//     'video/3gpp': ['3gp'],
//     'video/x-ms-wmv': ['wmv'],
    
//     // Archives
//     'application/zip': ['zip'],
//     'application/x-rar-compressed': ['rar'],
//     'application/x-7z-compressed': ['7z'],
//     'application/x-tar': ['tar'],
//     'application/gzip': ['gz'],
    
//     // Code files
//     'text/javascript': ['js'],
//     'text/css': ['css'],
//     'text/html': ['html', 'htm'],
//     'application/json': ['json'],
//     'text/xml': ['xml'],
//     'application/xml': ['xml']
//   };

//   console.log(`📁 File upload attempt - Name: ${file.originalname}, Type: ${file.mimetype}`);

//   // Check MIME type
//   if (!allowedTypes[file.mimetype]) {
//     console.error(`❌ File type ${file.mimetype} not allowed`);
//     return cb(new Error(`File type ${file.mimetype} is not allowed. Please upload a supported file format.`), false);
//   }

//   // Additional check: verify file extension matches MIME type
//   const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
//   const allowedExtensions = allowedTypes[file.mimetype];
  
//   if (fileExtension && !allowedExtensions.includes(fileExtension)) {
//     console.error(`❌ File extension ${fileExtension} doesn't match MIME type ${file.mimetype}`);
//     return cb(new Error(`File extension .${fileExtension} doesn't match the file type. Please ensure your file has the correct extension.`), false);
//   }

//   console.log(`✅ File type ${file.mimetype} accepted`);
//   cb(null, true);
// };

// // Create multer instance with configuration
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB limit
//     files: 1, // Only allow 1 file per upload
//     fields: 5, // Limit number of form fields
//     fieldNameSize: 50, // Limit field name size
//     fieldSize: 1024 * 1024 // Limit field value size to 1MB
//   },
// });

// // Error handling middleware for multer
// const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     switch (error.code) {
//       case 'LIMIT_FILE_SIZE':
//         return res.status(400).json({ 
//           error: 'File too large. Maximum size allowed is 50MB.' 
//         });
//       case 'LIMIT_FILE_COUNT':
//         return res.status(400).json({ 
//           error: 'Too many files. Only 1 file is allowed per upload.' 
//         });
//       case 'LIMIT_FIELD_COUNT':
//         return res.status(400).json({ 
//           error: 'Too many fields in the form.' 
//         });
//       case 'LIMIT_UNEXPECTED_FILE':
//         return res.status(400).json({ 
//           error: 'Unexpected file field. Please use "file" as the field name.' 
//         });
//       default:
//         return res.status(400).json({ 
//           error: `Upload error: ${error.message}` 
//         });
//     }
//   }
  
//   // Handle custom file filter errors
//   if (error.message && error.message.includes('not allowed')) {
//     return res.status(400).json({ 
//       error: error.message 
//     });
//   }
  
//   next(error);
// };

// // Utility function to get file category
// const getFileCategory = (mimetype) => {
//   if (mimetype.startsWith('image/')) return 'image';
//   if (mimetype.startsWith('video/')) return 'video';
//   if (mimetype.startsWith('audio/')) return 'audio';
//   if (mimetype.includes('pdf') || 
//       mimetype.includes('document') || 
//       mimetype.includes('text') ||
//       mimetype.includes('spreadsheet') ||
//       mimetype.includes('presentation')) return 'document';
//   return 'file';
// };

// // Utility function to format file size
// const formatFileSize = (bytes) => {
//   if (bytes === 0) return '0 B';
//   const k = 1024;
//   const sizes = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// };

// // Utility function to validate file integrity (optional)
// const validateFileIntegrity = async (filePath, originalname) => {
//   try {
//     const stats = await fs.stat(filePath);
    
//     // Check if file was properly written
//     if (stats.size === 0) {
//       throw new Error('File appears to be empty');
//     }
    
//     // Additional checks can be added here
//     return true;
//   } catch (error) {
//     console.error('File integrity check failed:', error);
//     return false;
//   }
// };

// // Clean up function for failed uploads
// const cleanupFile = async (filePath) => {
//   try {
//     if (await fs.pathExists(filePath)) {
//       await fs.unlink(filePath);
//       console.log(`🧹 Cleaned up file: ${filePath}`);
//     }
//   } catch (error) {
//     console.error('Failed to cleanup file:', error);
//   }
// };

// module.exports = {
//   upload,
//   handleMulterError,
//   getFileCategory,
//   formatFileSize,
//   validateFileIntegrity,
//   cleanupFile,
//   uploadsDir
// };


// middleware/uploadMiddleware.js (Alternative - Simpler Version)
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename using crypto for better uniqueness
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Sanitize filename
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const uniqueName = `${sanitizedBaseName}-${uniqueSuffix}${extension}`;
    
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    // Images
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg', 
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg',
    
    // Documents
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/rtf': 'rtf',
    
    // Audio
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/webm': 'webm',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    
    // Video
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/x-flv': 'flv',
    'video/3gpp': '3gp',
    
    // Archives
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    'application/x-tar': 'tar',
    'application/gzip': 'gz'
  };

  console.log(`📁 File upload attempt - Name: ${file.originalname}, Type: ${file.mimetype}`);

  if (allowedTypes[file.mimetype]) {
    console.log(`✅ File type ${file.mimetype} accepted`);
    cb(null, true);
  } else {
    console.error(`❌ File type ${file.mimetype} not allowed`);
    cb(new Error(`File type ${file.mimetype} is not allowed. Please upload a supported file format.`), false);
  }
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1, // Only allow 1 file per upload
  },
});

// Export the upload instance as default
module.exports = upload;