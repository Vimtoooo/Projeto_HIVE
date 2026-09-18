import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import { PersistenciaService } from '../persistence/persistencia.service';

@Injectable()
export class AuthService {
  constructor(private readonly persistencia: PersistenciaService) {}

  async login(email: string, senha: string) {
    const usuario = await this.persistencia.executar(
      (repositorio) => repositorio.buscarUsuarioPorEmail(email),
    );

    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    if (usuario.statusConta !== 'ATIVO') {
      throw new UnauthorizedException('Conta não está ativa.');
    }

    const senhaValida = await this.verificarSenha(
      senha,
      usuario.senha,
    );

    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return {
      idUsuario: usuario.idUsuario,
      nome: usuario.nome,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario,
    };
  }

  private async verificarSenha(
    senha: string,
    senhaArmazenada: string,
  ): Promise<boolean> {
    const [algoritmo, salt, hashArmazenado] =
      senhaArmazenada.split('$');

    if (algoritmo !== 'scrypt' || !salt || !hashArmazenado) {
      return false;
    }

    const hash = await new Promise<Buffer>((resolve, reject) => {
      const { scrypt } = require('node:crypto');

      scrypt(senha, salt, 64, (erro: Error | null, chave: Buffer) => {
        if (erro) {
          reject(erro);
        } else {
          resolve(chave);
        }
      });
    });

    const hashBanco = Buffer.from(hashArmazenado, 'hex');

    if (hashBanco.length !== hash.length) {
      return false;
    }

    return timingSafeEqual(hash, hashBanco);
  }
}