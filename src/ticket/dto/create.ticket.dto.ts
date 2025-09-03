import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsMongoId } from "class-validator";

export class CreateTicketDto {
  @ApiProperty({ enum: ['flowers', 'animals','cars'], description: 'Type of ticket title' })
  @IsString()
  title: 'flowers' | 'animals' |'cars';

  @ApiProperty({ description: 'The ID of the game' })
  @IsString()
  @IsMongoId({ message: 'gameId must be a valid MongoDB ObjectId' })
  gameId: string;
}
