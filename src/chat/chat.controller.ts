import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body()
    body: { sender: string; receiver?: string; groupId?: string; message: string },
  ) {
    return this.chatService.createMessage({
      sender: new Types.ObjectId(body.sender),
      receiver: body.receiver ? new Types.ObjectId(body.receiver) : undefined,
      groupId: body.groupId ? new Types.ObjectId(body.groupId) : undefined,
      message: body.message,
    });
  }

  @Get('private/:user1Id/:user2Id')
  async getPrivateChat(
    @Param('user1Id') user1Id: string,
    @Param('user2Id') user2Id: string,
  ) {
    return this.chatService.getPrivateMessages(
      new Types.ObjectId(user1Id),
      new Types.ObjectId(user2Id),
    );
  }

  @Get('group/:groupId')
  async getGroupChat(@Param('groupId') groupId: string) {
    return this.chatService.getGroupMessages(new Types.ObjectId(groupId));
  }

  @Post('group')
  async createGroup(
    @Body() body: { name: string; createdBy: string; members: string[]; description?: string },
  ) {
    return this.chatService.createGroup({
      name: body.name,
      createdBy: new Types.ObjectId(body.createdBy),
      members: body.members.map((id) => new Types.ObjectId(id)),
      description: body.description,
    });
  }

  @Post('group/:groupId/add-member')
  async addMember(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    return this.chatService.addMember(
      new Types.ObjectId(groupId),
      new Types.ObjectId(body.userId),
    );
  }

  @Get('user/:userId/groups')
  async getUserGroups(@Param('userId') userId: string) {
    const groups = await this.chatService.getUserGroups(new Types.ObjectId(userId));
    if (!groups.length) {
      throw new NotFoundException('No groups found for this user');
    }
    return groups;
  }
}
