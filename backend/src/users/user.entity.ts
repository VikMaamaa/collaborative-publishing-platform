import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { Post } from '../posts/post.entity';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ unique: true })
  @IsString()
  @MinLength(3)
  username: string;

  @Column()
  @IsString()
  @MinLength(6)
  password: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  firstName?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  lastName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => OrganizationMember, (member) => member.user)
  organizationMembers: OrganizationMember[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash if password is provided and not already hashed
    if (this.password && !this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    const result = await bcrypt.compare(password, this.password);
    return result;
  }

  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username;
  }

  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPERADMIN;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.isSuperAdmin();
  }

  isUser(): boolean {
    return this.role === UserRole.USER || this.isAdmin();
  }
}