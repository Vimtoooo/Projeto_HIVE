import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

function texto({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CadastroClienteDto {
  @Transform(texto)
  @IsString()
  @Length(3, 191)
  @Matches(/^[\p{L}][\p{L}\p{M}]*(?:[ '’-][\p{L}][\p{L}\p{M}]*)*$/u, {
    message:
      'O nome deve conter somente letras, espaços, hífen ou apóstrofo entre partes do nome.',
  })
  nome!: string;

  @Transform(texto)
  @IsEmail()
  @MaxLength(191)
  email!: string;

  @IsString()
  @Length(8, 128)
  senha!: string;

  @IsString()
  @Matches(/^\d{10,11}$/)
  telefone!: string;

  @IsString()
  @Matches(/^\d{11}$/)
  cpf!: string;

  @Transform(texto)
  @IsString()
  @Length(5, 191)
  endereco!: string;
}
