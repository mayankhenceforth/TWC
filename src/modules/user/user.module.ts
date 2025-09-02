import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';

@Module({
  providers: [UserService,CloudinaryService],
  controllers: [UserController]
})
export class UserModule {}
