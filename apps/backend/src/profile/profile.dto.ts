import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class UpdateProfileDto {
  @IsOptional() @Transform(trim) @IsString() @Length(3, 191) nome?: string;
  @IsOptional() @IsString() @Matches(/^\d{10,11}$/) telefone?: string;
  @IsOptional() @Transform(trim) @IsString() @Length(5, 191) endereco?: string;
}
