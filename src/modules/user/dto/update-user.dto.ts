import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the user' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email of the user' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Contact number of the user' })
  @IsOptional()
  @IsString()
  @Length(8, 15)
  contactNumber?: string;
}
