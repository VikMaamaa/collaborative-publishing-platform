import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsString, MinLength, IsOptional } from 'class-validator';
import { OrganizationMember } from './organization-member.entity';
import { Post } from '../posts/post.entity';
import { Invitation } from './invitation.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsString()
  @MinLength(2)
  name: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  website?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members: OrganizationMember[];

  @OneToMany(() => Post, (post) => post.organization)
  posts: Post[];

  @OneToMany(() => Invitation, (invitation) => invitation.organization)
  invitations: Invitation[];
} 