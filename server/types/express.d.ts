import { User } from '@shared/schema';
import 'express-session';

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}