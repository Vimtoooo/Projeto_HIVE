import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { FormaPagamento, StatusContratacao } from '@prisma/client';
export class CreateRequestDto {
  @IsInt() @Min(1) servicoId!: number;
  @IsEnum(FormaPagamento) formaPagamento!: FormaPagamento;
  @IsUUID('4') chave!: string;
}
export class RequestQueryDto {
  @IsOptional() @IsIn(['cliente', 'prestador']) papel: 'cliente' | 'prestador' =
    'cliente';
  @IsOptional() @IsEnum(StatusContratacao) status?: StatusContratacao;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) pagina = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limite = 20;
}
export class RequestActionDto {
  @IsIn(['ACEITAR', 'RECUSAR', 'CONCLUIR', 'CANCELAR']) acao!:
    | 'ACEITAR'
    | 'RECUSAR'
    | 'CONCLUIR'
    | 'CANCELAR';
}

export class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) nota!: number;
  @IsOptional() @IsString() @MaxLength(1000) comentario?: string;
}
