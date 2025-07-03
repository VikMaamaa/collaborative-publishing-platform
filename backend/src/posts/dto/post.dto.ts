import { IsString, IsOptional, IsEnum, IsBoolean, MinLength, IsUUID, IsIn } from 'class-validator';
import { PostStatus } from '../post.entity';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class SubmitForReviewDto {
  @IsUUID()
  postId: string;
}

export class ReviewPostDto {
  @IsUUID()
  postId: string;

  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class PostResponse {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  rejectionReason?: string;
  publishedAt?: Date;
  isPublic: boolean;
  authorId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export class PostListResponse {
  id: string;
  title: string;
  excerpt?: string;
  status: PostStatus;
  publishedAt?: Date;
  isPublic: boolean;
  authorId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  rejectionReason?: string;
  author?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  organization?: {
    id: string;
    name: string;
  };
} 