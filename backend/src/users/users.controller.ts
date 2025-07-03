import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto, UserResponse, ChangePasswordDto } from './users.service';
import { User } from './user.entity';
import { validate as uuidValidate } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req): Promise<UserResponse> {
    return this.usersService.findById(req.user.id);
  }

  @Get('me/:userId')
  @UseGuards(JwtAuthGuard)
  async getMeWithId(@Param('userId') userId: string, @Request() req): Promise<UserResponse> {
    // Ensure the authenticated user can only access their own data
    // if (req.user.id !== userId) {
    //   throw new NotFoundException('You can only access your own user data');
    // }
    return this.usersService.findById(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    if (!uuidValidate(id)) throw new NotFoundException('User not found');
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    if (!uuidValidate(id)) throw new NotFoundException('User not found');
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserResponse> {
    if (!uuidValidate(id)) throw new NotFoundException('User not found');
    return this.usersService.deactivate(id);
  }

  @Get(':id/organizations')
  async getUserOrganizations(@Param('id') id: string) {
    if (!uuidValidate(id)) throw new NotFoundException('User not found');
    return this.usersService.getUserOrganizations(id);
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @Request() req,
  ): Promise<UserResponse> {
    if (req.user.id !== id) throw new NotFoundException('You can only change your own password');
    return this.usersService.changePassword(id, dto);
  }
} 