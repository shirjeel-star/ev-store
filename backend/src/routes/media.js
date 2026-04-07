const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');
const { prisma } = require('../config/database');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// POST /api/media/upload
router.post('/upload', authenticate, requireAdmin, upload.array('files', 20), async (req, res, next) => {
  try {
    const uploads = await Promise.all(
      req.files.map((file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: req.body.folder || 'voltstore', resource_type: 'image' },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        })
      )
    );

    const mediaRecords = await Promise.all(
      uploads.map((u, i) =>
        prisma.media.create({
          data: {
            filename: req.files[i].originalname,
            url: u.secure_url,
            publicId: u.public_id,
            mimeType: req.files[i].mimetype,
            size: req.files[i].size,
            width: u.width,
            height: u.height,
            folder: req.body.folder || 'general',
            uploadedById: req.user.id,
          },
        })
      )
    );

    res.json({ success: true, data: mediaRecords });
  } catch (err) {
    next(err);
  }
});

// GET /api/media
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 30, folder } = req.query;
    const where = {};
    if (folder) where.folder = folder;
    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.media.count({ where }),
    ]);
    res.json({ success: true, data: items, pagination: { page: parseInt(page), total } });
  } catch (err) { next(err); }
});

// DELETE /api/media/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media) return res.status(404).json({ success: false, message: 'Not found' });
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId).catch(() => {});
    }
    await prisma.media.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
