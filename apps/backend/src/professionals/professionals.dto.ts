import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
const text = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const number = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
export class ProfessionalsQueryDto {
  @IsOptional() @Transform(text) @IsString() @Length(1, 191) texto?: string;
  @IsOptional()
  @Transform(text)
  @IsString()
  @Length(1, 191)
  areaAtuacao?: string;
  @Transform(number) @IsInt() @Min(1) @Max(100000) pagina = 1;
  @Transform(number) @IsInt() @Min(1) @Max(50) limite = 12;
}
export class ProfessionalIdDto {
  @Transform(number) @IsInt() @Min(1) @Max(2147483647) id!: number;
}
