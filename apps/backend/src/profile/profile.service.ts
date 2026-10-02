import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { UpdateProfileDto } from './profile.dto';
const select = {
  idUsuario: true,
  nome: true,
  email: true,
  cpf: true,
  telefone: true,
  endereco: true,
  tipoUsuario: true,
  dataCadastro: true,
} satisfies Prisma.UsuarioSelect;
function present(row: Prisma.UsuarioGetPayload<{ select: typeof select }>) {
  const { cpf, ...publicFields } = row;
  return { ...publicFields, cpfMascarado: `***.***.${cpf.slice(-5, -2)}-**` };
}
@Injectable()
export class ProfileService {
  constructor(private readonly db: PrismaClient) {}
  async get(user: number) {
    return present(
      await this.db.usuario.findUniqueOrThrow({
        where: { idUsuario: user },
        select,
      }),
    );
  }
  async update(user: number, input: UpdateProfileDto) {
    if (
      !Object.values(input).some((v) => v !== undefined) ||
      Object.values(input).some((v) => v === null)
    )
      throw new BadRequestException(
        'Informe ao menos um campo válido para atualizar.',
      );
    const data: Prisma.UsuarioUpdateInput = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.telefone !== undefined) data.telefone = input.telefone;
    if (input.endereco !== undefined) data.endereco = input.endereco;
    return present(
      await this.db.usuario.update({
        where: { idUsuario: user },
        data,
        select,
      }),
    );
  }
}
