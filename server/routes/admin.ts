import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../lib/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [
      totalUsers,
      totalUploads,
      totalGames,
      totalScores,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.upload.count(),
      prisma.gameSession.count(),
      prisma.score.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          createdAt: true,
          userId: true
        }
      })
    ]);

    const averageScore = await prisma.score.aggregate({
      _avg: {
        score: true
      }
    });

    res.json({
      totalUsers,
      totalUploads,
      totalGames,
      totalScores,
      averageScore: Math.round(averageScore._avg.score || 0),
      recentActivity
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get all users with pagination
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          xp: true,
          level: true,
          badges: true,
          lastActiveAt: true,
          createdAt: true,
          _count: {
            select: {
              uploads: true,
              scores: true,
              gameSessions: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all uploads with pagination
router.get('/uploads', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          gameSessions: {
            select: {
              id: true,
              title: true,
              isCompleted: true
            }
          }
        }
      }),
      prisma.upload.count()
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
    console.error('Admin uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = z.object({
      role: z.enum(['USER', 'ADMIN', 'MODERATOR'])
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER_ROLE',
        resource: 'user',
        resourceId: userId,
        metadata: { newRole: role }
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid role', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete upload
router.delete('/uploads/:uploadId', async (req: AuthRequest, res) => {
  try {
    const { uploadId } = req.params;

    await prisma.upload.delete({
      where: { id: uploadId }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_UPLOAD',
        resource: 'upload',
        resourceId: uploadId
      }
    });

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

// Get system health
router.get('/health', async (req: AuthRequest, res) => {
  try {
    const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      database: dbHealthy,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(uptime) + 's'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

export default router;
