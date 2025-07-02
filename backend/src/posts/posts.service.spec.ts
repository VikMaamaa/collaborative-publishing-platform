import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post, PostStatus } from './post.entity';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { OrganizationRole } from '../organizations/organization-role.enum';
import { TransactionService } from '../common/services/transaction.service';
import { NotificationQueue } from '../queues/notification.queue';
import {
  CreatePostDto,
  UpdatePostDto,
  SubmitForReviewDto,
  ReviewPostDto,
} from './dto/post.dto';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: Repository<Post>;
  let memberRepository: Repository<OrganizationMember>;

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMemberRepository = {
    findOne: jest.fn(),
  };

  const mockTransactionService = {
    executeInTransaction: jest.fn(),
  };

  const mockNotificationQueue = {
    addNotification: jest.fn().mockResolvedValue(undefined),
    addPostPublishedNotification: jest.fn().mockResolvedValue(undefined),
    addPostRejectedNotification: jest.fn().mockResolvedValue(undefined),
    addPostNeedsReviewNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: mockMemberRepository,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: NotificationQueue,
          useValue: mockNotificationQueue,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    memberRepository = module.get<Repository<OrganizationMember>>(getRepositoryToken(OrganizationMember));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const createDto: CreatePostDto = {
      title: 'Test Post',
      content: 'This is a test post content',
      excerpt: 'Test excerpt',
      isPublic: false,
    };

    const authorId = 'user-123';
    const organizationId = 'org-123';

    it('should create a post successfully', async () => {
      const mockMember = {
        userId: authorId,
        organizationId,
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockPost = {
        id: 'post-123',
        ...createDto,
        authorId,
        organizationId,
        status: PostStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        rejectionReason: null,
        publishedAt: null,
        author: null,
        organization: null,
        canBeEditedBy: jest.fn(),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn(),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockMember),
        create: jest.fn().mockReturnValue(mockPost),
        save: jest.fn().mockResolvedValue(mockPost),
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.createPost(createDto, authorId, organizationId);

      expect(mockTransactionService.executeInTransaction).toHaveBeenCalled();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(OrganizationMember, {
        where: {
          userId: authorId,
          organizationId,
          isActive: true,
        },
      });
      expect(mockEntityManager.create).toHaveBeenCalledWith(Post, {
        ...createDto,
        authorId,
        organizationId,
        status: PostStatus.DRAFT,
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(Post, mockPost);
      expect(result).toEqual(service['mapToPostResponse'](mockPost));
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await expect(service.createPost(createDto, authorId, organizationId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllPosts', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';

    it('should return all posts for editors and owners', async () => {
      const mockMember = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
      };

      const mockPosts = [
        {
          id: 'post-1',
          title: 'Post 1',
          content: 'Content 1',
          authorId: 'user-1',
          organizationId,
          status: PostStatus.DRAFT,
          excerpt: null,
          rejectionReason: null,
          publishedAt: null,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: null,
          organization: null,
        },
        {
          id: 'post-2',
          title: 'Post 2',
          content: 'Content 2',
          authorId: 'user-2',
          organizationId,
          status: PostStatus.PUBLISHED,
          excerpt: null,
          rejectionReason: null,
          publishedAt: new Date(),
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: null,
          organization: null,
        },
      ] as Post[];

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(mockPosts);

      const result = await service.findAllPosts(organizationId, userId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.organizationId = :organizationId', { organizationId });
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return only user posts for writers', async () => {
      const mockMember = {
        userId,
        organizationId,
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockPosts = [
        {
          id: 'post-1',
          title: 'My Post',
          content: 'My Content',
          authorId: userId,
          organizationId,
          status: PostStatus.DRAFT,
          excerpt: null,
          rejectionReason: null,
          publishedAt: null,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: null,
          organization: null,
        },
      ] as Post[];

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(mockPosts);

      const result = await service.findAllPosts(organizationId, userId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.authorId = :authorId', { authorId: userId });
      expect(result).toHaveLength(1);
    });

    it('should filter by status when provided', async () => {
      const mockMember = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
      };

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllPosts(organizationId, userId, PostStatus.DRAFT);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.status = :status', { status: PostStatus.DRAFT });
    });
  });

  describe('findPostById', () => {
    const postId = 'post-123';
    const userId = 'user-123';

    it('should return post if user has access', async () => {
      const mockPost = {
        id: postId,
        title: 'Test Post',
        content: 'Test Content',
        authorId: 'user-456',
        organizationId: 'org-123',
        status: PostStatus.DRAFT,
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.EDITOR,
        isActive: true,
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.findPostById(postId, userId);

      expect(result).toEqual(service['mapToPostResponse'](mockPost));
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findPostById(postId, userId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const mockPost = {
        id: postId,
        organizationId: 'org-123',
      } as Post;

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.findPostById(postId, userId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updatePost', () => {
    const updateDto: UpdatePostDto = {
      title: 'Updated Title',
    };
    const postId = 'post-123';
    const userId = 'user-123';

    it('should update post if user has permission', async () => {
      const mockPost = {
        id: postId,
        title: 'Original Title',
        content: 'Test content',
        authorId: userId,
        organizationId: 'org-123',
        status: PostStatus.DRAFT,
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
        canBeEditedBy: jest.fn().mockReturnValue(true),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn(),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
        save: jest.fn().mockResolvedValue(mockPost),
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.updatePost(postId, updateDto, userId);

      expect(mockTransactionService.executeInTransaction).toHaveBeenCalled();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Post, { where: { id: postId } });
      expect(mockEntityManager.save).toHaveBeenCalledWith(Post, mockPost);
      expect(result).toBeDefined();
    });

    it('should throw ConflictException for published posts', async () => {
      const mockPost = {
        id: postId,
        title: 'Published Post',
        content: 'Test content',
        authorId: userId,
        organizationId: 'org-123',
        status: PostStatus.PUBLISHED,
        excerpt: null,
        rejectionReason: null,
        publishedAt: new Date(),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
        canBeEditedBy: jest.fn().mockReturnValue(true),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn(),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await expect(service.updatePost(postId, updateDto, userId))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('submitForReview', () => {
    const submitDto: SubmitForReviewDto = {
      postId: 'post-123',
    };
    const userId = 'user-123';

    it('should submit draft post for review', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        content: 'Test content',
        authorId: userId,
        organizationId: 'org-123',
        status: PostStatus.DRAFT,
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
        canBeEditedBy: jest.fn(),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn(),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
        save: jest.fn().mockResolvedValue(mockPost),
        find: jest.fn().mockResolvedValue([]), // For finding editors
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.submitForReview(submitDto, userId);

      expect(mockTransactionService.executeInTransaction).toHaveBeenCalled();
      expect(mockPost.submitForReview).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalledWith(Post, mockPost);
      expect(result).toBeDefined();
    });

    it('should throw ConflictException for non-draft posts', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        content: 'Test content',
        authorId: userId,
        organizationId: 'org-123',
        status: PostStatus.PUBLISHED,
        excerpt: null,
        rejectionReason: null,
        publishedAt: new Date(),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await expect(service.submitForReview(submitDto, userId))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('reviewPost', () => {
    const reviewDto: ReviewPostDto = {
      postId: 'post-123',
      action: 'approve',
    };
    const userId = 'user-123';

    it('should approve post if user has permission', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-456',
        organizationId: 'org-123',
        status: PostStatus.IN_REVIEW,
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
        canBeEditedBy: jest.fn(),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn().mockReturnValue(true),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.EDITOR,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
        save: jest.fn().mockResolvedValue(mockPost),
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.reviewPost(reviewDto, userId);

      expect(mockTransactionService.executeInTransaction).toHaveBeenCalled();
      expect(mockPost.approve).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalledWith(Post, mockPost);
      expect(result).toBeDefined();
    });

    it('should reject post with reason', async () => {
      const rejectDto: ReviewPostDto = {
        postId: 'post-123',
        action: 'reject',
        rejectionReason: 'Not good enough',
      };

      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-456',
        organizationId: 'org-123',
        status: PostStatus.IN_REVIEW,
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
        canBeEditedBy: jest.fn(),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn().mockReturnValue(true),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.EDITOR,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
        save: jest.fn().mockResolvedValue(mockPost),
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      const result = await service.reviewPost(rejectDto, userId);

      expect(mockTransactionService.executeInTransaction).toHaveBeenCalled();
      expect(mockPost.reject).toHaveBeenCalledWith('Not good enough');
      expect(mockEntityManager.save).toHaveBeenCalledWith(Post, mockPost);
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if rejection reason is missing', async () => {
      const rejectDto: ReviewPostDto = {
        postId: 'post-123',
        action: 'reject',
      };

      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-456',
        organizationId: 'org-123',
        status: PostStatus.IN_REVIEW,
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
        canBeEditedBy: jest.fn(),
        canBePublishedBy: jest.fn(),
        canBeReviewedBy: jest.fn().mockReturnValue(true),
        submitForReview: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revertToDraft: jest.fn(),
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.EDITOR,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await expect(service.reviewPost(rejectDto, userId))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('deletePost', () => {
    const postId = 'post-123';
    const userId = 'user-123';

    it('should delete post if user has permission', async () => {
      const mockPost = {
        id: postId,
        authorId: userId,
        organizationId: 'org-123',
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await service.deletePost(postId, userId);

      expect(mockTransactionService.executeInTransaction).toHaveBeenCalled();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Post, { where: { id: postId } });
      expect(mockEntityManager.remove).toHaveBeenCalledWith(Post, mockPost);
    });

    it('should throw ForbiddenException if user cannot delete', async () => {
      const mockPost = {
        id: postId,
        authorId: 'other-user',
        organizationId: 'org-123',
        excerpt: null,
        rejectionReason: null,
        publishedAt: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: null,
        organization: null,
      } as Post;

      const mockMember = {
        userId,
        organizationId: 'org-123',
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockPost) // First call for post
          .mockResolvedValueOnce(mockMember), // Second call for member
      };

      mockTransactionService.executeInTransaction.mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      });

      await expect(service.deletePost(postId, userId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPublicPosts', () => {
    const organizationId = 'org-123';

    it('should return only public published posts', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Public Post',
          content: 'Public content',
          organizationId,
          status: PostStatus.PUBLISHED,
          isPublic: true,
          excerpt: null,
          rejectionReason: null,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          author: null,
          organization: null,
        },
      ] as Post[];

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(mockPosts);

      const result = await service.getPublicPosts(organizationId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.organizationId = :organizationId', { organizationId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.status = :status', { status: PostStatus.PUBLISHED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.isPublic = :isPublic', { isPublic: true });
      expect(result).toHaveLength(1);
    });
  });
}); 