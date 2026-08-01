import { NextResponse } from 'next/server';
import { PersistenceEngine } from '@/lib/db';
import { UserRepository } from '@/lib/repositories';
import { verifyPassword } from '@/lib/passwords';
import { createSession, toSafeUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const db = PersistenceEngine.getInstance();
    await db.initialize();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON request body.',
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required.',
          },
        },
        { status: 400 }
      );
    }

    const userRepo = new UserRepository(db);
    const user = await userRepo.findByEmail(email);

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        },
        { status: 401 }
      );
    }

    const session = await createSession(user.id);
    const safeUser = toSafeUser(user);

    const response = NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        token: session.token,
        expiresAt: session.expiresAt,
      },
    });

    response.headers.set(
      'Set-Cookie',
      `nexorapos_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected authentication error occurred.',
        },
      },
      { status: 500 }
    );
  }
}
