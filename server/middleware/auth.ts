import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[BEVEILIGING] JWT_SECRET is niet ingesteld als omgevingsvariabele. Server start geannuleerd.');
}
const JWT_SECRET_RESOLVED = JWT_SECRET || 'fallback_secret_key_for_dev_only';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Allow login and forgot-password without token (robust check)
  const isPublicPath = req.path === '/login' || 
                       req.path === '/forgot-password' || 
                       req.originalUrl.endsWith('/login') || 
                       req.originalUrl.endsWith('/forgot-password');
                       
  if (isPublicPath) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Geen token aanwezig' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET_RESOLVED);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Ongeldig token' });
  }
};
