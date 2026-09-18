import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(
    @Body() dados: { email: string; senha: string },
  ) {
    return this.authService.login(dados.email, dados.senha);
  }
}