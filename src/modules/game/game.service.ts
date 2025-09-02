// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Game, GameDocument } from 'src/comman/Schema/game.schema';
// import { CreateGameDto } from './dto/create.game.dto';
// import { UpdateGameDto } from './dto/update.game.dto';
// import { JoinGameDto } from './dto/join.game.dto';
// import { GameParticipation, GameParticipationDocument } from 'src/comman/Schema/gameParticipation.schema';


// @Injectable()
// export class GameService {
//   constructor(
//     @InjectModel(Game.name) private gameModel: Model<GameDocument>,
//     @InjectModel(GameParticipation.name) private gameParticipationModel:Model<GameParticipationDocument>
//   ) {}

//   async create(createGameDto: CreateGameDto): Promise<Game> {
//     // Validate that start time is in the future
//     if (new Date(createGameDto.startTime) <= new Date()) {
//       throw new BadRequestException('Start time must be in the future');
//     }

//     // Validate max participants
//     if (createGameDto.maxParticipants < 1) {
//       throw new BadRequestException('Max participants must be at least 1');
//     }

//     const createdGame = new this.gameModel({
//       ...createGameDto,
//        createdBy:'68b6a27177c53495946d09d4',
//       currentParticipants: 0,
//       status: 'upcoming'
//     });
    
//     return createdGame.save();
//   }

//   async findAll(
//     page: number = 1,
//     limit: number = 10,
//     status?: string,
//     search?: string
//   ): Promise<{ games: Game[]; total: number; pages: number }> {
//     const query: any = { isActive: true };
    
//     if (status) {
//       query.status = status;
//     }
    
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { description: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     const skip = (page - 1) * limit;
//     const total = await this.gameModel.countDocuments(query);
//     const games = await this.gameModel
//       .find(query)
//       .populate('createdBy', 'name username')
//       .populate('participantIds', 'name username')
//       .populate('winnerId', 'name username')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .exec();
    
//     return {
//       games,
//       total,
//       pages: Math.ceil(total / limit)
//     };
//   }

//   async findOne(id: string): Promise<Game> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid game ID');
//     }
    
//     const game = await this.gameModel
//       .findById(id)
//       .populate('createdBy', 'name username')
//       .populate('participantIds', 'name username')
//       .populate('winnerId', 'name username')
//       .exec();
    
//     if (!game || !game.isActive) {
//       throw new NotFoundException('Game not found');
//     }
    
//     return game;
//   }

//   async update(id: string, updateGameDto: UpdateGameDto): Promise<Game> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid game ID');
//     }
    
//     const game = await this.gameModel.findById(id).exec();
    
//     if (!game || !game.isActive) {
//       throw new NotFoundException('Game not found');
//     }
    
//     // Prevent updating certain fields if game has started
//     if (game.status !== 'upcoming') {
//       const { maxParticipants, startTime, ...allowedUpdates } = updateGameDto;
//       const updatedGame = await this.gameModel
//         .findByIdAndUpdate(id, allowedUpdates, { new: true })
//         .exec();
      
//       if (!updatedGame) {
//         throw new NotFoundException('Game not found after update');
//       }
//       return updatedGame;
//     }
    
//     const updatedGame = await this.gameModel
//       .findByIdAndUpdate(id, updateGameDto, { new: true })
//       .exec();
    
//     if (!updatedGame) {
//       throw new NotFoundException('Game not found after update');
//     }
//     return updatedGame;
//   }


//    async remove(id: string): Promise<Game> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid game ID');
//     }
    
//     const game = await this.gameModel.findById(id).exec();
    
//     if (!game || !game.isActive) {
//       throw new NotFoundException('Game not found');
//     }
    
//     // Soft delete
//     const deletedGame = await this.gameModel
//       .findByIdAndUpdate(id, { isActive: false }, { new: true })
//       .exec();
    
//     if (!deletedGame) {
//       throw new NotFoundException('Game not found after deletion');
//     }
//     return deletedGame;
//   }

//   async joinGame(gameId: string, joinGameDto: JoinGameDto): Promise<Game> {
//     if (!Types.ObjectId.isValid(gameId)) {
//       throw new BadRequestException('Invalid game ID');
//     }
    
//     const game = await this.gameModel.findById(gameId).exec();
    
//     if (!game || !game.isActive) {
//       throw new NotFoundException('Game not found');
//     }
    
//     if (game.status !== 'upcoming') {
//       throw new BadRequestException('Cannot join game that has already started');
//     }
    
//     if (game.currentParticipants >= game.maxParticipants) {
//       throw new BadRequestException('Game is already full');
//     }
    
//     // Convert userId to ObjectId for comparison
//     const userIdObject = new Types.ObjectId(joinGameDto.userId);
    
//     // Check if user is already a participant
//     if (game.participantIds.some(id => id.equals(userIdObject))) {
//       throw new BadRequestException('User is already a participant');
//     }
    
//     // Apply coupon logic if provided
//     let finalPrice = game.entryPrice;
//     if (joinGameDto.couponCode && game.couponCode === joinGameDto.couponCode) {
//       if (game.couponType === 'percentage' && game.couponDiscount) {
//         finalPrice = game.entryPrice * (1 - game.couponDiscount / 100);
//       } else if (game.couponType === 'fixed' && game.couponDiscount) {
//         finalPrice = Math.max(0, game.entryPrice - game.couponDiscount);
//       }
//     }
    
//     // Here you would typically process payment
    
//     // Add user to participants
//     game.participantIds.push(userIdObject);
//     game.currentParticipants += 1;
    
//     return game.save();
//   }
//   async startGame(id: string): Promise<Game> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid game ID');
//     }
    
//     const game = await this.gameModel.findById(id).exec();
    
//     if (!game || !game.isActive) {
//       throw new NotFoundException('Game not found');
//     }
    
//     if (game.status !== 'upcoming') {
//       throw new BadRequestException('Game has already started or completed');
//     }
    
//     if (game.currentParticipants < 1) {
//       throw new BadRequestException('Cannot start game with no participants');
//     }
    
//     game.status = 'ongoing';
//     game.startTime = new Date(); // Update to actual start time
    
//     return game.save();
//   }

//   async completeGame(id: string, winnerId: string): Promise<Game> {
//     if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(winnerId)) {
//       throw new BadRequestException('Invalid ID provided');
//     }
    
//     const game = await this.gameModel.findById(id).exec();
    
//     if (!game || !game.isActive) {
//       throw new NotFoundException('Game not found');
//     }
    
//     if (game.status !== 'ongoing') {
//       throw new BadRequestException('Game is not ongoing');
//     }
    
//     if (!game.participantIds.includes(new Types.ObjectId(winnerId))) {
//       throw new BadRequestException('Winner must be a participant');
//     }
    
//     game.status = 'completed';
//     game.winnerId = new Types.ObjectId(winnerId);
//     game.endTime = new Date();
    
    
//     return game.save();
//   }

//   async getUserGames(userId: string): Promise<Game[]> {
//     if (!Types.ObjectId.isValid(userId)) {
//       throw new BadRequestException('Invalid user ID');
//     }
    
//     return this.gameModel
//       .find({ 
//         participantIds: userId, 
//         isActive: true 
//       })
//       .populate('createdBy', 'name username')
//       .populate('winnerId', 'name username')
//       .sort({ createdAt: -1 })
//       .exec();
//   }

//   async getCreatedGames(userId: string): Promise<Game[]> {
//     if (!Types.ObjectId.isValid(userId)) {
//       throw new BadRequestException('Invalid user ID');
//     }
    
//     return this.gameModel
//       .find({ 
//         createdBy: userId, 
//         isActive: true 
//       })
//       .populate('participantIds', 'name username')
//       .populate('winnerId', 'name username')
//       .sort({ createdAt: -1 })
//       .exec();
//   }
// }

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from 'src/comman/Schema/game.schema';

import { CreateGameDto } from './dto/create.game.dto';
import { UpdateGameDto } from './dto/update.game.dto';
import { JoinGameDto } from './dto/join.game.dto';
import { GameParticipation, GameParticipationDocument } from 'src/comman/Schema/gameParticipation.schema';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(GameParticipation.name) private participationModel: Model<GameParticipationDocument>,
  ) {}

  async create(createGameDto: CreateGameDto): Promise<Game> {
    // Validate that start time is in the future
    if (new Date(createGameDto.startTime) <= new Date()) {
      throw new BadRequestException('Start time must be in the future');
    }

    // Validate max participants
    if (createGameDto.maxParticipants < 1) {
      throw new BadRequestException('Max participants must be at least 1');
    }

    const createdGame = new this.gameModel({
      ...createGameDto,
      createdBy: '68b6a27177c53495946d09d4',
      currentParticipants: 0,
      status: 'upcoming'
    });
    
    return createdGame.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ): Promise<{ games: Game[]; total: number; pages: number }> {
    const query: any = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    const total = await this.gameModel.countDocuments(query);
    const games = await this.gameModel
      .find(query)
      .populate('createdBy', 'name username')
      .populate('participantIds', 'name username')
      .populate('winnerId', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    return {
      games,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<Game> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid game ID');
    }
    
    const game = await this.gameModel
      .findById(id)
      .populate('createdBy', 'name username')
      .populate('participantIds', 'name username')
      .populate('winnerId', 'name username')
      .exec();
    
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }
    
    return game;
  }

  async update(id: string, updateGameDto: UpdateGameDto): Promise<Game> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid game ID');
    }
    
    const game = await this.gameModel.findById(id).exec();
    
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }
    
    // Prevent updating certain fields if game has started
    if (game.status !== 'upcoming') {
      const { maxParticipants, startTime, ...allowedUpdates } = updateGameDto;
      const updatedGame = await this.gameModel
        .findByIdAndUpdate(id, allowedUpdates, { new: true })
        .exec();
      
      if (!updatedGame) {
        throw new NotFoundException('Game not found after update');
      }
      return updatedGame;
    }
    
    const updatedGame = await this.gameModel
      .findByIdAndUpdate(id, updateGameDto, { new: true })
      .exec();
    
    if (!updatedGame) {
      throw new NotFoundException('Game not found after update');
    }
    return updatedGame;
  }

  async remove(id: string): Promise<Game> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid game ID');
    }
    
    const game = await this.gameModel.findById(id).exec();
    
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }
    
    // Soft delete
    const deletedGame = await this.gameModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
    
    if (!deletedGame) {
      throw new NotFoundException('Game not found after deletion');
    }
    return deletedGame;
  }

  async joinGame(gameId: string, joinGameDto: JoinGameDto): Promise<{ game: Game; participation: GameParticipation }> {
    if (!Types.ObjectId.isValid(gameId)) {
      throw new BadRequestException('Invalid game ID');
    }
    
    const game = await this.gameModel.findById(gameId).exec();
    
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }
    
    if (game.status !== 'upcoming') {
      throw new BadRequestException('Cannot join game that has already started');
    }
    
    if (game.currentParticipants >= game.maxParticipants) {
      throw new BadRequestException('Game is already full');
    }
    
    // Convert userId to ObjectId for comparison
    console.log("userId:",joinGameDto.userId)
    const userIdObject = new Types.ObjectId(joinGameDto.userId);
    console.log("userId Object:",userIdObject)
    // Check if user is already a participant
    if (game.participantIds.some(id => id.equals(userIdObject))) {
      throw new BadRequestException('User is already a participant');
    }
    
    // Apply coupon logic if provided
    let finalPrice = game.entryPrice;
    if (joinGameDto.couponCode && game.couponCode === joinGameDto.couponCode) {
      if (game.couponType === 'percentage' && game.couponDiscount) {
        finalPrice = game.entryPrice * (1 - game.couponDiscount / 100);
      } else if (game.couponType === 'fixed' && game.couponDiscount) {
        finalPrice = Math.max(0, game.entryPrice - game.couponDiscount);
      }
    }
    
    // Here you would typically process payment
    
    // Create participation record
    const participation = new this.participationModel({
      userId: userIdObject,
      gameId: new Types.ObjectId(gameId),
      couponUsed: joinGameDto.couponCode,
      amountPaid: finalPrice,
      status: 'joined'
    });
    
    const savedParticipation = await participation.save();
    
    // Add user to participants and update count
    game.participantIds.push(userIdObject);
    game.currentParticipants += 1;
    
    const updatedGame = await game.save();
    
    return {
      game: updatedGame,
      participation: savedParticipation
    };
  }

  async startGame(id: string): Promise<Game> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid game ID');
    }
    
    const game = await this.gameModel.findById(id).exec();
    
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }
    
    if (game.status !== 'upcoming') {
      throw new BadRequestException('Game has already started or completed');
    }
    
    if (game.currentParticipants < 1) {
      throw new BadRequestException('Cannot start game with no participants');
    }
    
    game.status = 'ongoing';
    game.startTime = new Date(); // Update to actual start time
    
    return game.save();
  }

  async completeGame(id: string, winnerId: string): Promise<{ game: Game; winnerParticipation: GameParticipation }> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(winnerId)) {
      throw new BadRequestException('Invalid ID provided');
    }
    
    const game = await this.gameModel.findById(id).exec();
    
    if (!game || !game.isActive) {
      throw new NotFoundException('Game not found');
    }
    
    if (game.status !== 'ongoing') {
      throw new BadRequestException('Game is not ongoing');
    }
    
    const winnerIdObject = new Types.ObjectId(winnerId);
    
    if (!game.participantIds.some(id => id.equals(winnerIdObject))) {
      throw new BadRequestException('Winner must be a participant');
    }
    
    // Update all participation records
    await this.participationModel.updateMany(
      { gameId: id, isActive: true },
      { status: 'completed' }
    ).exec();
    
    // Update winner's participation record
    const winnerParticipation = await this.participationModel.findOneAndUpdate(
      { gameId: id, userId: winnerId, isActive: true },
      { status: 'won' },
      { new: true }
    ).exec();
    
    if (!winnerParticipation) {
      throw new NotFoundException('Winner participation record not found');
    }
    
    // Update game status
    game.status = 'completed';
    game.winnerId = winnerIdObject;
    game.endTime = new Date();
    
    const updatedGame = await game.save();
    
    return {
      game: updatedGame,
      winnerParticipation
    };
  }

  async getUserGames(userId: string): Promise<Game[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.gameModel
      .find({ 
        participantIds: userId, 
        isActive: true 
      })
      .populate('createdBy', 'name username')
      .populate('winnerId', 'name username')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCreatedGames(userId: string): Promise<Game[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.gameModel
      .find({ 
        createdBy: userId, 
        isActive: true 
      })
      .populate('participantIds', 'name username')
      .populate('winnerId', 'name username')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserParticipations(userId: string): Promise<GameParticipation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.participationModel
      .find({ userId, isActive: true })
      .populate('gameId', 'title status winnerPrice')
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getGameParticipations(gameId: string): Promise<GameParticipation[]> {
    if (!Types.ObjectId.isValid(gameId)) {
      throw new BadRequestException('Invalid game ID');
    }
    
    return this.participationModel
      .find({ gameId, isActive: true })
      .populate('userId', 'name username')
      .populate('gameId', 'title status')
      .sort({ createdAt: -1 })
      .exec();
  }
}