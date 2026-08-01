import { NextResponse } from 'next/server';
import { PersistenceEngine } from '@/lib/db';
import { SessionRepository } from '@/lib/repositories';
import { extractTokenFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const db = PersistenceEngine.getInstance();
    await db.initialize();

    const token = extractTokenFromRequest(request);
    if (token) {
      const sessionRepo = new SessionRepository(db);
      await sessionRepo.deleteByToken(token);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully.',
      },
    });

    response.headers.set(
      'Set-Cookie',
      'nexorapos_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during logout.',
        },
      },
      { status: 500 }
    );
  }
}
