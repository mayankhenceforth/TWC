import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Account, AccountDocument } from 'src/schema/account.schema';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
     private readonly cloudinaryService: CloudinaryService,

  ) {}

  async getUserById(userId: mongoose.Types.ObjectId) {
    const user = await this.userModel.findById(userId).select('-password'); // hide password
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(userId: mongoose.Types.ObjectId, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateUserDto },
      { new: true },
    ).select('-password');
    if (!updatedUser) throw new NotFoundException('User not found');
    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }

  async removeUser(userId: mongoose.Types.ObjectId) {
    const deletedUser = await this.userModel.findByIdAndDelete(userId);
    if (!deletedUser) throw new NotFoundException('User not found');
    return { message: 'User account deleted successfully' };
  }

   async uploadProfileImage(userId: Types.ObjectId, file: Express.Multer.File) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!file) throw new BadRequestException('No file uploaded');

    // if user already has an image, delete the old one
    if (user.profileImagePublicId) {
      await this.cloudinaryService.deleteFile(user.profileImagePublicId);
    }

    // upload new image
    const uploadResult = await this.cloudinaryService.uploadFile(file,'user_apis','image');
    if(!uploadResult){
        throw new NotFoundException("Image not upload proper.... please try again")
    }

    user.profileImageUrl = uploadResult.secure_url;
    user.profileImagePublicId = uploadResult.public_id;
    await user.save();

    return {
      message: 'Profile image updated successfully',
      profileImageUrl: user.profileImageUrl,
    };
  }

  async removeProfileImage(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.profileImagePublicId) {
      throw new BadRequestException('No profile image to delete');
    }

    await this.cloudinaryService.deleteFile(user.profileImagePublicId);

    user.profileImageUrl = '';
    user.profileImagePublicId = '';
    await user.save();

    return { message: 'Profile image removed successfully' };
  }
}
