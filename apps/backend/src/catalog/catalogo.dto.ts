import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsEmail,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

function texto({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function numero({ value }: { value: unknown }): unknown {
  // Não converter arrays, strings vazias ou booleanos em números válidos.
  return typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
}

export class ServicoInicialDto {
  @Transform(texto)
  @IsString()
  @Length(5, 191)
  titulo!: string;

  @Transform(texto)
  @IsString()
  @Length(1, 5000)
  descricao!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000)
  precoBase!: number;
}

export class CadastroPrestadorDto {
  @Transform(texto)
  @IsString()
  @Length(3, 191)
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

  @Transform(texto)
  @IsString()
  @Length(1, 191)
  areaAtuacao!: string;

  @Transform(texto)
  @IsString()
  @Length(1, 191)
  experiencia!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 191, { each: true })
  @Matches(/\S/, { each: true })
  certificacoes!: string[];

  @IsString()
  @Matches(/^\d{14}$/)
  cnpj!: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ServicoInicialDto)
  servico!: ServicoInicialDto;
}

export class BuscarServicosDto {
  @IsOptional()
  @Transform(texto)
  @IsString()
  @Length(1, 191)
  texto?: string;

  @IsOptional()
  @Transform(texto)
  @IsString()
  @Length(1, 191)
  areaAtuacao?: string;

  @IsOptional()
  @Transform(numero)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  precoMin?: number;

  @IsOptional()
  @Transform(numero)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  precoMax?: number;

  @IsOptional()
  @Transform(numero)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  prestadorId?: number;

  @Transform(numero)
  @IsInt()
  @Min(1)
  @Max(100_000)
  pagina: number = 1;

  @Transform(numero)
  @IsInt()
  @Min(1)
  @Max(100)
  limite: number = 20;
}
