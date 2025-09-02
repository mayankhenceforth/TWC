import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example:123456})  
  @IsNumber()
  otp: number;
}