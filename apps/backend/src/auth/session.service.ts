import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
export const SESSION_COOKIE = 'hive_session';
export type SessionRequest = Request & { usuarioId: number };
@Injectable()
export class SessionService {
  constructor(private readonly db: PrismaClient) {}
  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private token(req: Request) {
    return (
      req.headers.cookie
        ?.split(';')
        .map((v) => v.trim())
        .find((v) => v.startsWith(SESSION_COOKIE + '='))
        ?.slice(SESSION_COOKIE.length + 1) ?? ''
    );
  }
  async create(usuarioId: number, req: Request, res: Response) {
    await this.revoke(req);
    await this.db.sessao.deleteMany({
      where: { usuarioId, expiraEm: { lte: new Date() } },
    });
    const token = randomBytes(32).toString('hex');
    const maxAge = 8 * 60 * 60 * 1000;
    await this.db.sessao.create({
      data: {
        tokenHash: this.hash(token),
        usuarioId,
        expiraEm: new Date(Date.now() + maxAge),
      },
    });
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
    });
  }
  async identify(req: Request) {
    const token = this.token(req);
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new UnauthorizedException('Entre novamente para continuar.');
    const session = await this.db.sessao.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { usuario: { select: { statusConta: true } } },
    });
    if (
      !session ||
      session.expiraEm <= new Date() ||
      session.usuario.statusConta !== 'ATIVO'
    )
      throw new UnauthorizedException('Entre novamente para continuar.');
    return session.usuarioId;
  }
  async revoke(req: Request) {
    const token = this.token(req);
    if (token)
      await this.db.sessao.deleteMany({
        where: { tokenHash: this.hash(token) },
      });
  }
}
