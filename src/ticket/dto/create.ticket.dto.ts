import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsMongoId } from "class-validator";

export class CreateTicketDto {
  @ApiProperty({ enum: ['flowers', 'animals'], description: 'Type of ticket title' })
  @IsString()
  title: 'flowers' | 'animals';

  @ApiProperty({ description: 'The ID of the game' })
  @IsString()
  @IsMongoId({ message: 'gameId must be a valid MongoDB ObjectId' })
  gameId: string;
}
