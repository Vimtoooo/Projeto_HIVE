import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class StartConversationDto {
  @IsInt() @Min(1) prestadorId!: number;
}
export class SendMessageDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  conteudo!: string;
  @IsUUID('4') chave!: string;
}
export class MessagePageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) antes?: number;
}
