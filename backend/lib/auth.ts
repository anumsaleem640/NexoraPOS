import crypto from 'node:crypto';
import { User, Session, UserRole } from './schema';
import { UserRepository, SessionRepository } from './repositories';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Strips passwordHash and returns safe user information.
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * System roles and permissions matrix.
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  manager: [
    'products:*',
    'categories:*',
    'inventory:*',
    'orders:*',
    'customers:*',
    'users:read',
    'settings:read',
    'profile:own',
  ],
  cashier: [
    'products:read',
    'categories:read',
    'inventory:read',
    'orders:*',
    'customers:*',
    'profile:own',
  ],
  customer: [
    'products:read',
    'categories:read',
    'orders:own',
    'profile:own',
  ],
};

/**
 * Checks if a role possesses a specific permission string.
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;
  if (permissions.includes(permission)) return true;

  // Wildcard scope check (e.g. 'products:*' matches 'products:read')
  const [domain] = permission.split(':');
  if (permissions.includes(`${domain}:*`)) return true;

  return false;
}

/**
 * Generates a cryptographically random session token and persists a session.
 */
export async function createSession(userId: string): Promise<Session> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  const session: Session = {
    id: `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId,
    token,
    expiresAt,
    createdAt: now.toISOString(),
  };

  const sessionRepo = new SessionRepository();
  await sessionRepo.create(session);
  return session;
}

/**
 * Extracts session token from HTTP Request headers or cookies.
 */
export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Cookie fallback: nexorapos_session=<token>
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('nexorapos_session=')) {
        return cookie.substring('nexorapos_session='.length).trim();
      }
    }
  }

  return null;
}

export interface AuthResult {
  user: User;
  safeUser: SafeUser;
  session: Session;
}

/**
 * Resolves currently authenticated user & session from request.
 * Returns AuthResult or null.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthResult | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  const sessionRepo = new SessionRepository();
  const session = await sessionRepo.findByToken(token);
  if (!session) return null;

  // Verify session expiration
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await sessionRepo.deleteByToken(token);
    return null;
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findById(session.userId);
  if (!user || !user.isActive) return null;

  return {
    user,
    safeUser: toSafeUser(user),
    session,
  };
}

/**
 * Server-side Guard: Ensures request is authenticated.
 * Throws UnauthorizedError if not authenticated.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    throw new UnauthorizedError('Authentication required. Invalid or expired token.');
  }
  return auth;
}

/**
 * Server-side Guard: Ensures authenticated user possesses required permission.
 * Throws ForbiddenError if user lacks permission.
 */
export async function requirePermission(request: Request, permission: string): Promise<AuthResult> {
  const auth = await requireAuth(request);
  if (!hasPermission(auth.user.role, permission)) {
    throw new ForbiddenError(`Access denied. Role '${auth.user.role}' lacks '${permission}' permission.`);
  }
  return auth;
}
