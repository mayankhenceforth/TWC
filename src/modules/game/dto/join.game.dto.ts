import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinGameDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsMongoId() 
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}