import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SessionService, SessionRequest } from './session.service';
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    // Custom header prevents cross-origin form CSRF; CORS does not permit credentials.
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers['x-hive-request'] !== '1'
    )
      throw new ForbiddenException('Requisição inválida.');
    req.usuarioId = await this.sessions.identify(req);
    return true;
  }
}
