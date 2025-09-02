import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  
 constructor(private readonly userService:UserService) { }

  
}
