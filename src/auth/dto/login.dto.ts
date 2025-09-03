import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example:"abc@gmail.com"})
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
