import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateToken, authenticate, AuthRequest } from '../lib/auth';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        badges: true,
        createdAt: true
      }
    });

    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('User found:', !!user);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Checking password...');
    const isValidPassword = await comparePassword(password, user.passwordHash);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    const token = generateToken(user.id, user.email, user.role);
    console.log('Login successful for:', email);

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      createdAt: user.createdAt
    };

    res.json({
      user: userResponse,
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        badges: true,
        streakDays: true,
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
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional()
    });

    const { name, email } = updateSchema.parse(req.body);

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.user!.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        badges: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const passwordSchema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6)
    });

    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
