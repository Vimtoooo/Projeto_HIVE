import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
export class ReviewsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) pagina = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) limite = 5;
}
