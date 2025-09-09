
import { BadRequestException, Body, Controller, Patch, Post, Query, Request, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { GameService } from "./game.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { CreateGameDto } from "./dto/create.game.dto";
import { Game } from "src/schema/game.schema";
import { AuthGuards } from "src/guards/auth.guards";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { UpdateGameDto } from "./dto/update.game.dto";
import mongoose from "mongoose";

@ApiBearerAuth()
@UseGuards(AuthGuards)
@Controller('game')
export class GameController {

    constructor(
        private readonly gameService: GameService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post("upload")
    @UseInterceptors()
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: 'Profile picture uploaded successfully.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        const isVideo = file.mimetype.startsWith('video/');
        const uploaded = await this.cloudinaryService.uploadFile(file, 'user_apis', isVideo ? 'video' : 'image');

        return {
            url: uploaded.secure_url,
            publicId: uploaded.public_id
        };
    }


    @Post()
    @ApiOperation({ summary: 'Create a new game' })
    @ApiResponse({ status: 201, description: 'Game successfully created', type: Game })
    @ApiResponse({ status: 400, description: 'Bad request' })

    async create(@Body() createGameDto: CreateGameDto, @Request() req): Promise<any> {
        const userId = req.user._id;
        return this.gameService.create(createGameDto, userId);
    }


    @Patch()
    @ApiOperation({ summary: 'Update the game' })
    async updateGame(
        @Body() updateGameDto: UpdateGameDto,
        @Request() req,
        @Query('gameId') gameId: string, // always string from query
    ) {
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(gameId)) {
            throw new BadRequestException('Invalid gameId');
        }

        return this.gameService.update(updateGameDto, userId, new mongoose.Types.ObjectId(gameId));
    }
}