import { IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class TokenQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value)) // Transform string to number
  skip?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Number(value)) // Transform string to number
  take?: number;
}
