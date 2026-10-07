import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service';
import { SESSION_COOKIE, SessionService } from './session.service';
import type { SessionRequest } from './session.service';
import { SessionGuard } from './session.guard';
class LoginDto {
  @IsEmail() @MaxLength(191) email!: string;
  @IsString() @MinLength(1) @MaxLength(128) senha!: string;
}
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly db: PrismaClient,
  ) {}
  @Post('login')
  async login(
    @Body() dados: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.headers['x-hive-request'] !== '1')
      throw new ForbiddenException('Requisição inválida.');
    const user = await this.auth.login(dados.email, dados.senha);
    await this.sessions.create(user.idUsuario, req, res);
    return user;
  }
  @Get('sessao')
  @UseGuards(SessionGuard)
  me(@Req() req: SessionRequest) {
    return this.db.usuario.findUniqueOrThrow({
      where: { idUsuario: req.usuarioId },
      select: { idUsuario: true, nome: true, email: true, tipoUsuario: true },
    });
  }
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (req.headers['x-hive-request'] !== '1')
      throw new ForbiddenException('Requisição inválida.');
    await this.sessions.revoke(req);
    res.clearCookie(SESSION_COOKIE, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}
