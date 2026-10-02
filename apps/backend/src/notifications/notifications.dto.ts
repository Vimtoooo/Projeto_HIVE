import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
export class NotificationQueryDto {
  @IsOptional() @IsIn(['solicitacoes', 'mensagens']) categoria?:
    | 'solicitacoes'
    | 'mensagens';
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  naoLidas?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  antes?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  ateId?: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(50) limite = 20;
}
export class ReadNotificationsDto {
  @IsInt() @Min(0) @Max(2147483647) ateId!: number;
}
