import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxParticipants: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty()
  @IsString()
  durationUnit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  entryPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  winnerPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  couponDiscount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponType?: string;

  @ApiProperty()
  @IsDateString()
  startTime: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  rules?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty()
  @IsNotEmpty()
  createdBy: string;
}