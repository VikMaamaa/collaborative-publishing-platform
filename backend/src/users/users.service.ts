import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { OrganizationRole } from '../organizations/organization-role.enum';
import * as bcrypt from 'bcryptjs';
import { validate as uuidValidate } from 'uuid';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { Post } from '../posts/post.entity';

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  role?: UserRole;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Type for user response without password and methods
export type UserResponse = {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationMembers: OrganizationMember[];
  posts: Post[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUser: boolean;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
      throw new ConflictException('Email already exists');
    }
      if (existingUser.username === createUserDto.username) {
      throw new ConflictException('Username already exists');
    }
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    
    const { password, hashPassword, validatePassword, getFullName, ...userResponse } = savedUser;
    return {
      ...userResponse,
      isSuperAdmin: savedUser.isSuperAdmin(),
      isAdmin: savedUser.isAdmin(),
      isUser: savedUser.isUser(),
    };
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.userRepository.find();
    return users.map(user => {
      const { password, hashPassword, validatePassword, getFullName, ...userResponse } = user;
      return {
        ...userResponse,
        isSuperAdmin: user.isSuperAdmin(),
        isAdmin: user.isAdmin(),
        isUser: user.isUser(),
      };
    });
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organizationMembers', 'posts'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, hashPassword, validatePassword, getFullName, ...userResponse } = user;
    return {
      ...userResponse,
      isSuperAdmin: user.isSuperAdmin(),
      isAdmin: user.isAdmin(),
      isUser: user.isUser(),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, isActive: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email or username is being updated and if it conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('User with this username already exists');
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    
    const { password, hashPassword, validatePassword, getFullName, ...userResponse } = updatedUser;
    return {
      ...userResponse,
      isSuperAdmin: updatedUser.isSuperAdmin(),
      isAdmin: updatedUser.isAdmin(),
      isUser: updatedUser.isUser(),
    };
  }

  async deactivate(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    const deactivatedUser = await this.userRepository.save(user);
    
    const { password, hashPassword, validatePassword, getFullName, ...userResponse } = deactivatedUser;
    return {
      ...userResponse,
      isSuperAdmin: deactivatedUser.isSuperAdmin(),
      isAdmin: deactivatedUser.isAdmin(),
      isUser: deactivatedUser.isUser(),
    };
  }

  async activate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async changeRole(id: string, role: UserRole): Promise<User> {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.findById(id);
    user.role = role;
    return this.userRepository.save(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (user) {
      // Create a fresh user instance to avoid any potential entity mutation
      const freshUser = new User();
      Object.assign(freshUser, user);

      const isValid = await freshUser.validatePassword(password);
      if (isValid) {
        return user; // Return the original user instance
      }
    }

    return null;
  }

  async getUserOrganizations(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organizationMembers', 'organizationMembers.organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.organizationMembers
      .filter(member => member.isActive)
      .map(member => ({
        organization: member.organization,
        role: member.role,
        joinedAt: member.createdAt,
      }));
  }

  async getUserRoleInOrganization(userId: string, organizationId: string): Promise<OrganizationRole | null> {
    // Directly query the OrganizationMember repository for active membership
    const membership = await this.organizationMemberRepository.findOne({
      where: { userId, organizationId, isActive: true },
    });
    return membership ? membership.role : null;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return user.validatePassword(password);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const isValid = await user.validatePassword(dto.currentPassword);
    if (!isValid) throw new BadRequestException('Current password is incorrect');
    user.password = dto.newPassword;
    const updatedUser = await this.userRepository.save(user);
    const { password, hashPassword, validatePassword, getFullName, ...userResponse } = updatedUser;
    return {
      ...userResponse,
      isSuperAdmin: updatedUser.isSuperAdmin(),
      isAdmin: updatedUser.isAdmin(),
      isUser: updatedUser.isUser(),
    };
  }
} 