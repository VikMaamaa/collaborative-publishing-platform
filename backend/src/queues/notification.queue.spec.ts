import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationQueue, NotificationJobData } from './notification.queue';

describe('NotificationQueue', () => {
  let service: NotificationQueue;
  let queue: Queue;

  const mockQueue = {
    add: jest.fn(),
    getJobCounts: jest.fn(),
    getFailed: jest.fn(),
    getJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueue,
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationQueue>(NotificationQueue);
    queue = module.get<Queue>(getQueueToken('notifications'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addNotificationJob', () => {
    it('should add a notification job with default options', async () => {
      const jobData: NotificationJobData = {
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_published',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.addNotificationJob(jobData);

      expect(mockQueue.add).toHaveBeenCalledWith('post_published', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      expect(result).toBe(mockJob);
    });

    it('should add a notification job with custom options', async () => {
      const jobData: NotificationJobData = {
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_rejected',
      };

      const customOptions = {
        attempts: 5,
        delay: 5000,
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.addNotificationJob(jobData, customOptions);

      expect(mockQueue.add).toHaveBeenCalledWith('post_rejected', jobData, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
        delay: 5000,
      });
      expect(result).toBe(mockJob);
    });
  });

  describe('addPostPublishedNotification', () => {
    it('should add a post published notification job', async () => {
      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.addPostPublishedNotification(
        'post-123',
        'org-123',
        'user-123',
        'Test Post',
        ['user-456', 'user-789'],
      );

      expect(mockQueue.add).toHaveBeenCalledWith('post_published', {
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_published',
        recipients: ['user-456', 'user-789'],
      }, expect.any(Object));
      expect(result).toBe(mockJob);
    });
  });

  describe('addPostRejectedNotification', () => {
    it('should add a post rejected notification job', async () => {
      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.addPostRejectedNotification(
        'post-123',
        'org-123',
        'user-123',
        'Test Post',
        'Content needs improvement',
      );

      expect(mockQueue.add).toHaveBeenCalledWith('post_rejected', {
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_rejected',
        metadata: { rejectionReason: 'Content needs improvement' },
      }, expect.any(Object));
      expect(result).toBe(mockJob);
    });
  });

  describe('addPostNeedsReviewNotification', () => {
    it('should add a post needs review notification job', async () => {
      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.addPostNeedsReviewNotification(
        'post-123',
        'org-123',
        'user-123',
        'Test Post',
        ['editor-1', 'editor-2'],
      );

      expect(mockQueue.add).toHaveBeenCalledWith('post_needs_review', {
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_needs_review',
        recipients: ['editor-1', 'editor-2'],
      }, expect.any(Object));
      expect(result).toBe(mockJob);
    });
  });

  describe('getJobCounts', () => {
    it('should return job counts', async () => {
      const mockCounts = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
      };
      mockQueue.getJobCounts.mockResolvedValue(mockCounts);

      const result = await service.getJobCounts();

      expect(mockQueue.getJobCounts).toHaveBeenCalled();
      expect(result).toBe(mockCounts);
    });
  });

  describe('getFailedJobs', () => {
    it('should return failed jobs', async () => {
      const mockFailedJobs = [
        { id: 'job-1', data: { postId: 'post-123' } },
        { id: 'job-2', data: { postId: 'post-456' } },
      ];
      mockQueue.getFailed.mockResolvedValue(mockFailedJobs);

      const result = await service.getFailedJobs();

      expect(mockQueue.getFailed).toHaveBeenCalled();
      expect(result).toBe(mockFailedJobs);
    });
  });

  describe('retryFailedJob', () => {
    it('should retry a failed job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        retry: jest.fn().mockResolvedValue(true),
      };
      mockQueue.getJob.mockResolvedValue(mockJob);

      const result = await service.retryFailedJob('job-123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
      expect(mockJob.retry).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error when job not found', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      await expect(service.retryFailedJob('job-123')).rejects.toThrow('Job not found');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
    });
  });
}); 