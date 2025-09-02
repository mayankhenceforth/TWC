import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create.game.dto';
import { Game } from 'src/comman/Schema/game.schema';
import { UpdateGameDto } from './dto/update.game.dto';
import { JoinGameDto } from './dto/join.game.dto';
import { AuthGuards } from 'src/comman/Guards/auth.guards';
import { RoleGuards } from 'src/comman/Guards/role.guards';
import { Roles } from 'src/comman/decorator/role.decorator';
import { Role } from 'src/comman/enums/role.enum';
import { GameParticipation } from 'src/comman/Schema/gameParticipation.schema';

@ApiTags('games')
@Controller('games')
@ApiBearerAuth()
@UseGuards(AuthGuards ,RoleGuards)
 @Roles(Role.Admin ,Role.SuperAdmin)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new game' })
  @ApiResponse({ status: 201, description: 'Game successfully created', type: Game })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createGameDto: CreateGameDto, @Request() req): Promise<Game> {
    // Set the creator to the authenticated user
    createGameDto.createdBy = req.user.userId;
    return this.gameService.create(createGameDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all games with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of games', type: [Game] })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status: string,
    @Query('search') search: string,
  ): Promise<{ games: Game[]; total: number; pages: number }> {
    return this.gameService.findAll(page, limit, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a game by ID' })
  @ApiResponse({ status: 200, description: 'Game found', type: Game })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async findOne(@Param('id') id: string): Promise<Game> {
    return this.gameService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a game' })
  @ApiResponse({ status: 200, description: 'Game updated', type: Game })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async update(
    @Param('id') id: string,
    @Body() updateGameDto: UpdateGameDto,
    @Request() req,
  ): Promise<Game> {
    // Verify the user owns the game or is admin
    const game = await this.gameService.findOne(id);
    if (game.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own games');
    }
    
    return this.gameService.update(id, updateGameDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a game' })
  @ApiResponse({ status: 200, description: 'Game deleted', type: Game })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<Game> {
    // Verify the user owns the game or is admin
    const game = await this.gameService.findOne(id);
    if (game.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own games');
    }
    
    return this.gameService.remove(id);
  }

  @Post(':id/join')
@Roles(Role.User)
@ApiOperation({ summary: 'Join a game' })
@ApiResponse({ status: 200, description: 'Successfully joined game' })
@ApiResponse({ status: 404, description: 'Game not found' })
@ApiResponse({ status: 400, description: 'Cannot join game' })
async joinGame(
  @Param('id') id: string,
  @Body() joinGameDto: JoinGameDto,
  @Request() req,
): Promise<{ message: string; game: Game; participation: GameParticipation }> {
  // Set the user ID from the authenticated user
  joinGameDto.userId = req.user.userId;
  
  const result = await this.gameService.joinGame(id, joinGameDto);
  
  return {
    message: 'Successfully joined the game',
    game: result.game,
    participation: result.participation
  };
}

  @Put(':id/start')
  @Roles(Role.User)
  @ApiOperation({ summary: 'Start a game' })
  @ApiResponse({ status: 200, description: 'Game started', type: Game })
  @ApiResponse({ status: 404, description: 'Game not found' })
  @ApiResponse({ status: 400, description: 'Cannot start game' })
  async startGame(@Param('id') id: string, @Request() req): Promise<Game> {
    // Verify the user owns the game or is admin
    const game = await this.gameService.findOne(id);
    if (game.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only start your own games');
    }
    
    return this.gameService.startGame(id);
  }

  @Put(':id/complete')
  @Roles(Role.User)
  @ApiOperation({ summary: 'Complete a game and set winner' })
  @ApiResponse({ status: 200, description: 'Game completed', type: Game })
  @ApiResponse({ status: 404, description: 'Game not found' })
  @ApiResponse({ status: 400, description: 'Cannot complete game' })
  async completeGame(
    @Param('id') id: string,
    @Body('winnerId') winnerId: string,
    @Request() req,
  ): Promise<Game> {
    // Verify the user owns the game or is admin
    const game = await this.gameService.findOne(id);
    if (game.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only complete your own games');
    }
    
    const result = await this.gameService.completeGame(id, winnerId);
    return result.game;
  }

  @Get('user/participating')
  @Roles(Role.Admin ,Role.User)
  @ApiOperation({ summary: 'Get games the user is participating in' })
  @ApiResponse({ status: 200, description: 'List of user games', type: [Game] })
  async getUserGames(@Request() req): Promise<Game[]> {
    return this.gameService.getUserGames(req.user.userId);
  }

  @Get('user/created')
  @ApiOperation({ summary: 'Get games created by the user' })
  @ApiResponse({ status: 200, description: 'List of created games', type: [Game] })
  async getCreatedGames(@Request() req): Promise<Game[]> {
    return this.gameService.getCreatedGames(req.user.userId);
  }
}