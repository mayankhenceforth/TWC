import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: '+919876543210' })
    @IsString()
    @IsNotEmpty()
    contactNumber: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'm1y21@123' })
    @IsString()
    password: string;


    @ApiProperty({ enum: ['admin', 'user', 'super-admin'], example: 'user' })
    @IsEnum(['admin', 'user', 'super-admin'])
    role: 'admin' | 'user' | 'super-admin';
}
