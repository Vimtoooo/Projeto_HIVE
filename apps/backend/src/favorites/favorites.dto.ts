import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
export class FavoriteIdDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @Min(1)
  @Max(2147483647)
  prestadorId!: number;
}
export class FavoriteBodyDto {}
