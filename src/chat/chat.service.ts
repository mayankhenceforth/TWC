import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chats, ChatsDocument } from './schema/chat.schema';
import { Group, GroupDocument } from './schema/group.schema';


@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Chats.name)
        private readonly chatsModel: Model<ChatsDocument>,

        @InjectModel(Group.name)
        private readonly groupModel: Model<GroupDocument>,
    ) { }

    async createMessage(data: {
        sender: Types.ObjectId;
        receiver?: Types.ObjectId;
        groupId?: Types.ObjectId;
        message: string;
    }) {
        const newMessage = new this.chatsModel(data);
        return await newMessage.save();
    }

    async getPrivateMessages(user1: Types.ObjectId, user2: Types.ObjectId) {
        return this.chatsModel
            .find({
                $or: [
                    { sender: user1, receiver: user2 },
                    { sender: user2, receiver: user1 },
                ],
            })
            .sort({ createdAt: 1 })
            .exec();
    }

    async getGroupMessages(groupId: Types.ObjectId) {
        return this.chatsModel
            .find({ groupId })
            .sort({ createdAt: 1 })
            .exec();
    }

    async createGroup(data: { name: string; createdBy: Types.ObjectId; members: Types.ObjectId[]; description?: string }) {
        const newGroup = new this.groupModel(data);
        return await newGroup.save();
    }

    async addMember(groupId: Types.ObjectId, userId: Types.ObjectId) {
        const group = await this.groupModel.findById(groupId);
        if (!group) throw new NotFoundException('Group not found');

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
        }
        return group;
    }

    async getUserGroups(userId: Types.ObjectId) {
        return this.groupModel.find({ members: userId }).exec();
    }
}
