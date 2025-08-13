import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../lib/auth';
import { 
  validateFile, 
  extractTextFromFile, 
  extractTextFromUrl, 
  urlSchema, 
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE 
} from '../lib/fileProcessing';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    try {
      validateFile(file);
      cb(null, true);
    } catch (error) {
      cb(new Error(error instanceof Error ? error.message : 'File validation failed'));
    }
  }
});

// Upload file endpoint
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const extractedContent = await extractTextFromFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const uploadRecord = await prisma.upload.create({
      data: {
        userId: req.user!.id,
        fileName: req.file.originalname,
        fileUrl: `memory://${req.file.originalname}`, // In production, save to S3/Supabase
        fileType: req.file.mimetype,
        originalText: extractedContent.text,
        extractedText: extractedContent.text,
        isProcessed: false
      }
    });

    res.status(201).json({
      uploadId: uploadRecord.id,
      fileName: uploadRecord.fileName,
      fileType: uploadRecord.fileType,
      extractedText: extractedContent.text.substring(0, 500) + '...', // Preview
      metadata: extractedContent.metadata,
      message: 'File uploaded and text extracted successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process file upload' 
    });
  }
});

// Upload URL endpoint
router.post('/url', authenticate, async (req: AuthRequest, res) => {
  try {
    const { url } = urlSchema.parse(req.body);

    const extractedContent = await extractTextFromUrl(url);

    const uploadRecord = await prisma.upload.create({
      data: {
        userId: req.user!.id,
        fileName: extractedContent.metadata.fileName,
        fileUrl: url,
        fileType: extractedContent.metadata.fileType,
        originalText: extractedContent.text,
        extractedText: extractedContent.text,
        isProcessed: false
      }
    });

    res.status(201).json({
      uploadId: uploadRecord.id,
      fileName: uploadRecord.fileName,
      fileType: uploadRecord.fileType,
      extractedText: extractedContent.text.substring(0, 500) + '...', // Preview
      metadata: extractedContent.metadata,
      message: 'URL content extracted successfully'
    });
  } catch (error) {
    console.error('URL upload error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid URL', details: error.errors });
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process URL' 
    });
  }
});

// Get upload details
router.get('/:uploadId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { uploadId } = req.params;

    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        userId: req.user!.id
      },
      include: {
        gameSessions: {
          select: {
            id: true,
            title: true,
            gameType: true,
            isCompleted: true,
            createdAt: true
          }
        }
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json(upload);
  } catch (error) {
    console.error('Get upload error:', error);
    res.status(500).json({ error: 'Failed to fetch upload details' });
  }
});

// Get user's upload history
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          gameSessions: {
            select: {
              id: true,
              title: true,
              gameType: true,
              isCompleted: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.upload.count({
        where: { userId: req.user!.id }
      })
    ]);

    res.json({
      uploads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// Delete upload
router.delete('/:uploadId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { uploadId } = req.params;

    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        userId: req.user!.id
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    await prisma.upload.delete({
      where: { id: uploadId }
    });

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

export default router;
