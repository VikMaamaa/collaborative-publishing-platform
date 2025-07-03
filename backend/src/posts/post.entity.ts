import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsString, MinLength, IsOptional } from 'class-validator';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

export enum PostStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @MinLength(1)
  title: string;

  @Column({ type: 'text' })
  @IsString()
  @MinLength(10)
  content: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column({ default: false })
  isPublic: boolean;

  @Column()
  authorId: string;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Organization, (organization) => organization.posts)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Methods
  canBeEditedBy(userId: string, userRole: string): boolean {
    // Authors can always edit their own posts (except published)
    if (this.authorId === userId) {
      return this.status !== PostStatus.PUBLISHED;
    }

    // Editors and owners can edit any post in their organization
    return userRole === 'editor' || userRole === 'owner';
  }

  canBePublishedBy(userRole: string): boolean {
    return userRole === 'editor' || userRole === 'owner';
  }

  canBeReviewedBy(userRole: string): boolean {
    return userRole === 'editor' || userRole === 'owner';
  }

  submitForReview(): void {
    if (this.status === PostStatus.DRAFT) {
      this.status = PostStatus.IN_REVIEW;
    }
  }

  approve(): void {
    if (this.status === PostStatus.IN_REVIEW) {
      this.status = PostStatus.PUBLISHED;
      this.publishedAt = new Date();
      this.isPublic = true;
    }
  }

  reject(reason: string): void {
    if (this.status === PostStatus.IN_REVIEW) {
      this.status = PostStatus.REJECTED;
      this.rejectionReason = reason;
    }
  }

  revertToDraft(): void {
    this.status = PostStatus.DRAFT;
    this.rejectionReason = null;
  }
} 