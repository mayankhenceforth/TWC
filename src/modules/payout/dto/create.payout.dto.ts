import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsString,
} from 'class-validator';

export class CreatePayoutDto {
    @ApiProperty({ example: "abc@gmail.com" })
    @IsNotEmpty()
    @IsString()
    readonly country: string;

    @ApiProperty({ example: '123456789012345' })
    @IsNotEmpty()
    @IsNumber()
    readonly accountNumber: number;

    @ApiProperty({ example: '123456789012345' })
    @IsNotEmpty()
    @IsNumber()
    readonly routingNumber: number;
}
