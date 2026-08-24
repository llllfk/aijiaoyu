import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './auth';
import type { JwtPayload } from './auth';

export function withAuth(
  handler: (req: Request, payload: JwtPayload, params?: any) => Promise<NextResponse>,
  options: { roles?: string[] } = {},
) {
  return async (req: Request, context?: any) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效或已过期' }, { status: 401 });
    }

    if (options.roles && !options.roles.includes(payload.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // context may be { params: Promise<...> } - resolve params
    let resolvedParams = context;
    if (context?.params && typeof context.params === 'object' && typeof context.params.then === 'function') {
      resolvedParams = await context.params;
    } else if (context?.params) {
      resolvedParams = context.params;
    }

    return handler(req, payload, resolvedParams);
  };
}

// Optional auth - user may or may not be logged in
export function withAuthOptional(
  handler: (req: Request, user: JwtPayload | null, params?: any) => Promise<NextResponse>,
) {
  return async (req: Request, context?: any) => {
    const token = getTokenFromRequest(req);
    let user: JwtPayload | null = null;
    if (token) {
      user = verifyToken(token);
    }

    let resolvedParams = context;
    if (context?.params && typeof context.params === 'object' && typeof context.params.then === 'function') {
      resolvedParams = await context.params;
    } else if (context?.params) {
      resolvedParams = context.params;
    }

    return handler(req, user, resolvedParams);
  };
}
