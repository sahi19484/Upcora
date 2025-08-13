import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'upcora-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, 12);
  } catch (error) {
    console.error('bcrypt hashing failed:', error);
    // Fallback to a simple hash for development (NOT FOR PRODUCTION)
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(password + 'upcora-salt').digest('hex');
  }
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    // First try bcrypt
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('bcrypt compare failed, trying fallback:', error);
    // Fallback comparison
    const crypto = await import('crypto');
    const testHash = crypto.createHash('sha256').update(password + 'loomify-salt').digest('hex');
    return testHash === hash;
  }
};

export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin required.' });
  }
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true }
        });
        req.user = user || undefined;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
