import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuards } from 'src/comman/Guards/auth.guards';
import mongoose from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthGuards)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get logged-in user information' })
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('User not authenticated');
    return this.userService.getUserById(new mongoose.Types.ObjectId(user._id));
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update logged-in user profile' })
  async updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('User not authenticated');
    return this.userService.updateUser(new mongoose.Types.ObjectId(user._id), updateUserDto);
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Delete logged-in user account' })
  async removeUser(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('User not authenticated');
    return this.userService.removeUser(new mongoose.Types.ObjectId(user._id));
  }

  @Post('upload-profile')
  @ApiOperation({ summary: 'Upload or update profile image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
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
  async uploadProfile(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('User not authenticated');
    return this.userService.uploadProfileImage(new mongoose.Types.ObjectId(user._id), file);
  }

  @Delete('remove-profile')
  @ApiOperation({ summary: 'Remove profile image' })
  async removeProfile(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new BadRequestException('User not authenticated');
    return this.userService.removeProfileImage(new mongoose.Types.ObjectId(user._id));
  }
}
