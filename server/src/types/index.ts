export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
