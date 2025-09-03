import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 123456,
    description: '6-digit OTP sent to user’s email',
  })
  @IsNumber({}, { message: 'OTP must be a number' })
  otp: number;

  @ApiProperty({
    example: 'NewSecurePassword@123',
    description: 'New password for the account (min 8 chars)',
  })
  @IsNotEmpty({ message: 'Password should not be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Length(8, 64, { message: 'Password must be between 8 and 64 characters long' })
  newPassword: string;
}
