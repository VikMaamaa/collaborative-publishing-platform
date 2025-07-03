import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './post.entity';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { OrganizationRole } from '../organizations/organization-role.enum';
import { TransactionService } from '../common/services/transaction.service';
import { NotificationQueue } from '../queues/notification.queue';
import { RealtimeService } from '../realtime/realtime.service';
import {
  CreatePostDto,
  UpdatePostDto,
  SubmitForReviewDto,
  ReviewPostDto,
  PostResponse,
  PostListResponse,
} from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private transactionService: TransactionService,
    private notificationQueue: NotificationQueue,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createPost(
    createDto: CreatePostDto,
    authorId: string,
    organizationId: string,
  ): Promise<PostResponse> {
    return this.transactionService.executeInTransaction(async (entityManager) => {
      // Verify user is a member of the organization
      const member = await entityManager.findOne(OrganizationMember, {
        where: {
          userId: authorId,
          organizationId,
          isActive: true,
        },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      const post = entityManager.create(Post, {
        ...createDto,
        authorId,
        organizationId,
        status: PostStatus.DRAFT,
      });

      const savedPost = await entityManager.save(Post, post);
      // Realtime notification
      this.realtimeService.sendPostUpdate(authorId, savedPost.title, { postId: savedPost.id, action: 'created' });
      return this.mapToPostResponse(savedPost);
    });
  }

  async findAllPosts(
    organizationId: string,
    userId: string,
    status?: PostStatus,
  ): Promise<PostListResponse[]> {
    // Verify user is a member of the organization
    const member = await this.memberRepository.findOne({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.organization', 'organization')
      .where('post.organizationId = :organizationId', { organizationId });

    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    // Writers can only see their own posts, editors and owners can see all
    if (member.role === OrganizationRole.WRITER) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId: userId });
    }

    const posts = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    return posts.map(post => this.mapToPostListResponse(post));
  }

  async findPostById(
    postId: string,
    userId: string,
  ): Promise<PostResponse> {
    const post = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.organization', 'organization')
      .where('post.id = :postId', { postId })
      .getOne();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Verify user is a member of the organization
    const member = await this.memberRepository.findOne({
      where: {
        userId,
        organizationId: post.organizationId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Writers can only see their own posts, editors and owners can see all
    if (member.role === OrganizationRole.WRITER && post.authorId !== userId) {
      throw new ForbiddenException('You can only view your own posts');
    }

    return this.mapToPostResponse(post);
  }

  async updatePost(
    postId: string,
    updateDto: UpdatePostDto,
    userId: string,
  ): Promise<PostResponse> {
    return this.transactionService.executeInTransaction(async (entityManager) => {
      const post = await entityManager.findOne(Post, {
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Verify user is a member of the organization
      const member = await entityManager.findOne(OrganizationMember, {
        where: {
          userId,
          organizationId: post.organizationId,
          isActive: true,
        },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Check if user can edit this post
      if (!post.canBeEditedBy(userId, member.role)) {
        throw new ForbiddenException('You cannot edit this post');
      }

      // For published posts, only allow specific updates for editors and owners
      if (post.status === PostStatus.PUBLISHED) {
        const isEditorOrOwner = member.role === OrganizationRole.EDITOR || member.role === OrganizationRole.OWNER;
        const isReviewUpdate = updateDto.rejectionReason !== undefined;
        const isStatusUpdate = updateDto.status !== undefined;
        
        // Allow editors/owners to update review feedback and status on published posts
        if (isEditorOrOwner && (isReviewUpdate || isStatusUpdate)) {
          // Only allow these specific fields to be updated
          if (isReviewUpdate) {
            post.rejectionReason = updateDto.rejectionReason;
          }
          if (isStatusUpdate) {
            post.status = updateDto.status;
          }
          // Don't allow other fields to be updated on published posts
        } else {
          throw new ConflictException('Published posts cannot be edited except for review feedback and status by editors/owners');
        }
      } else {
        // For non-published posts, allow full updates
        console.log('Updating post:', { postId, updateDto, currentStatus: post.status });
        Object.assign(post, updateDto);
        console.log('Post after update:', { newStatus: post.status });
      }

      const updatedPost = await entityManager.save(Post, post);
      // Realtime notification
      this.realtimeService.sendPostUpdate(userId, updatedPost.title, { postId: updatedPost.id, action: 'updated' });
      return this.mapToPostResponse(updatedPost);
    });
  }

  async deletePost(
    postId: string,
    userId: string,
  ): Promise<void> {
    return this.transactionService.executeInTransaction(async (entityManager) => {
      const post = await entityManager.findOne(Post, {
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Verify user is a member of the organization
      const member = await entityManager.findOne(OrganizationMember, {
        where: {
          userId,
          organizationId: post.organizationId,
          isActive: true,
        },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Only authors, editors, and owners can delete posts
      if (post.authorId !== userId && 
          member.role !== OrganizationRole.EDITOR && 
          member.role !== OrganizationRole.OWNER) {
        throw new ForbiddenException('You cannot delete this post');
      }

      await entityManager.remove(Post, post);
      // Realtime notification
      this.realtimeService.sendPostUpdate(userId, post.title, { postId: post.id, action: 'deleted' });
    });
  }

  async submitForReview(
    submitDto: SubmitForReviewDto,
    userId: string,
  ): Promise<PostResponse> {
    return this.transactionService.executeInTransaction(async (entityManager) => {
      const post = await entityManager.findOne(Post, {
        where: { id: submitDto.postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Verify user is a member of the organization
      const member = await entityManager.findOne(OrganizationMember, {
        where: {
          userId,
          organizationId: post.organizationId,
          isActive: true,
        },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Only authors can submit their own posts for review
      if (post.authorId !== userId) {
        throw new ForbiddenException('You can only submit your own posts for review');
      }

      // Only draft posts can be submitted for review
      if (post.status !== PostStatus.DRAFT) {
        throw new ConflictException('Only draft posts can be submitted for review');
      }

      post.submitForReview();
      const updatedPost = await entityManager.save(Post, post);

      // Get editors for notification
      const editors = await entityManager.find(OrganizationMember, {
        where: {
          organizationId: post.organizationId,
          role: OrganizationRole.EDITOR,
          isActive: true,
        },
      });

      const editorIds = editors.map(editor => editor.userId);

      // Add notification job (outside transaction)
      this.notificationQueue.addPostNeedsReviewNotification(
        post.id,
        post.organizationId,
        post.authorId,
        post.title,
        editorIds,
      );

      return this.mapToPostResponse(updatedPost);
    });
  }

  async reviewPost(
    reviewDto: ReviewPostDto,
    userId: string,
  ): Promise<PostResponse> {
    return this.transactionService.executeInTransaction(async (entityManager) => {
      const post = await entityManager.findOne(Post, {
        where: { id: reviewDto.postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Verify user is a member of the organization
      const member = await entityManager.findOne(OrganizationMember, {
        where: {
          userId,
          organizationId: post.organizationId,
          isActive: true,
        },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Only editors and owners can review posts
      if (!post.canBeReviewedBy(member.role)) {
        throw new ForbiddenException('You cannot review posts');
      }

      // Only posts in review can be reviewed
      if (post.status !== PostStatus.IN_REVIEW) {
        throw new ConflictException('Only posts in review can be reviewed');
      }

      if (reviewDto.action === 'approve') {
        post.approve();
      } else if (reviewDto.action === 'reject') {
        if (!reviewDto.rejectionReason) {
          throw new ConflictException('Rejection reason is required');
        }
        post.reject(reviewDto.rejectionReason);
      }

      const updatedPost = await entityManager.save(Post, post);

      // Add notification job based on action (outside transaction)
      if (reviewDto.action === 'approve') {
        this.notificationQueue.addPostPublishedNotification(
          post.id,
          post.organizationId,
          post.authorId,
          post.title,
        );
      } else if (reviewDto.action === 'reject') {
        this.notificationQueue.addPostRejectedNotification(
          post.id,
          post.organizationId,
          post.authorId,
          post.title,
          reviewDto.rejectionReason,
        );
      }

      return this.mapToPostResponse(updatedPost);
    });
  }

  async revertToDraft(
    postId: string,
    userId: string,
  ): Promise<PostResponse> {
    return this.transactionService.executeInTransaction(async (entityManager) => {
      const post = await entityManager.findOne(Post, {
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Verify user is a member of the organization
      const member = await entityManager.findOne(OrganizationMember, {
        where: {
          userId,
          organizationId: post.organizationId,
          isActive: true,
        },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Only rejected posts can be reverted to draft
      if (post.status !== PostStatus.REJECTED) {
        throw new ConflictException('Only rejected posts can be reverted to draft');
      }

      // Only authors can revert their own posts
      if (post.authorId !== userId) {
        throw new ForbiddenException('You can only revert your own posts');
      }

      post.revertToDraft();
      const updatedPost = await entityManager.save(Post, post);

      return this.mapToPostResponse(updatedPost);
    });
  }

  async getPostsByStatus(
    organizationId: string,
    userId: string,
    status: PostStatus,
  ): Promise<PostListResponse[]> {
    return this.findAllPosts(organizationId, userId, status);
  }

  async getPublicPosts(organizationId: string): Promise<PostListResponse[]> {
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.organization', 'organization')
      .where('post.organizationId = :organizationId', { organizationId })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.isPublic = :isPublic', { isPublic: true })
      .orderBy('post.publishedAt', 'DESC')
      .getMany();

    return posts.map(post => this.mapToPostListResponse(post));
  }

  private mapToPostResponse(post: Post): PostResponse {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      rejectionReason: post.rejectionReason,
      publishedAt: post.publishedAt,
      isPublic: post.isPublic,
      authorId: post.authorId,
      organizationId: post.organizationId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author ? {
        id: post.author.id,
        email: post.author.email,
        username: post.author.username,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
      } : undefined,
      organization: post.organization ? {
        id: post.organization.id,
        name: post.organization.name,
      } : undefined,
    };
  }

  private mapToPostListResponse(post: Post): PostListResponse {
    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      status: post.status,
      publishedAt: post.publishedAt,
      isPublic: post.isPublic,
      authorId: post.authorId,
      organizationId: post.organizationId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      content: post.content,
      rejectionReason: post.rejectionReason,
      author: post.author ? {
        id: post.author.id,
        email: post.author.email,
        username: post.author.username,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
      } : undefined,
      organization: post.organization ? {
        id: post.organization.id,
        name: post.organization.name,
      } : undefined,
    };
  }
} 