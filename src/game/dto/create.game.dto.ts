import { 
  IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min, IsEnum 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GameStatus, GameType } from 'src/enums/game.enum';


export class CreateGameDto {
  @ApiProperty() @IsNotEmpty() @IsString() title: string;
  @ApiProperty() @IsNotEmpty() @IsString() caption: string;
  @ApiProperty() @IsNumber() @Min(0) playAmount: number;
  @ApiProperty() @IsNumber() @Min(1) numberOfPlayers: number;
  @ApiProperty() @IsNumber() @Min(1) numberOfWinners: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() imageUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() imagePublicId?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() videoUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() videoPublicId?: string;

  @ApiProperty() @IsNumber() @Min(0) duration: number;
  @ApiProperty({ enum: ['minutes', 'hours', 'days'] }) @IsString() durationUnit: 'minutes' | 'hours' | 'days';

  @ApiProperty({ required: false }) @IsOptional() @IsString() couponCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() couponDiscount?: number;
  @ApiProperty({ required: false, enum: ['percentage', 'fixed'] }) @IsOptional() @IsString() couponType?: string;

  @ApiProperty() @IsDateString() startTime: Date;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endTime?: Date;
  @ApiProperty({ enum: GameType }) @IsNotEmpty() @IsEnum(GameType) gameType: GameType;
  @ApiProperty({ enum: GameStatus, required: false }) @IsOptional() @IsEnum(GameStatus) status?: GameStatus;
}
