import { Body, Controller, Delete, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import mongoose from 'mongoose';
import { VerifyOtpDto } from './dto/otp.verification.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuards } from 'src/guards/auth.guards';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("sign-up")
    @ApiOperation({ summary: 'Register a new user', description: 'Creates a new user account with the provided details.' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    @ApiResponse({ status: 409, description: 'User already exists.' })
    signUpUser(@Body() signUpDto: SignUpDto) {
        return this.authService.signUp(signUpDto);
    }

    @Post('email-verify')
    @ApiOperation({ summary: 'Send OTP for user verification', description: 'Sends a one-time password (OTP) to the user for account verification.' })
    @ApiQuery({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async sendOtp(@Query('id') id: string) {
        const userId = new mongoose.Types.ObjectId(id);
        return this.authService.sendUserVerificationOtp(userId);
    }

    @Post('otpVerification')
    @ApiOperation({ summary: 'Verify user with OTP', description: 'Verifies the user account using the provided OTP.' })
    @ApiQuery({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' })
    @ApiResponse({ status: 200, description: 'User verified successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid OTP.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async otpVerification(@Body() dto: VerifyOtpDto, @Query('id') id: string) {
        console.log("userId:", id)
        const userId = new mongoose.Types.ObjectId(id)

        console.log("user Mogodb id:", userId)
        return this.authService.userVerifiedUsingOtp(userId, dto.otp)
    }

    @Post('login')
    @ApiOperation({ summary: 'User login', description: 'Authenticates a user with their credentials.' })
    @ApiResponse({ status: 200, description: 'User logged in successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    async login(@Body() logindto: LoginDto) {
        return this.authService.login(logindto)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuards)
    @Delete('logout')
    async logout(@Req() request: Request) {
        // Access the user object attached by AuthGuards
        const user = (request as any).user;
        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        return await this.authService.logout(new mongoose.Types.ObjectId(user._id));
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request OTP for password reset' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestForgotPasswordOtp(dto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using OTP' })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPasswordWithOtp(dto.email, dto.otp, dto.newPassword);
    }




}
