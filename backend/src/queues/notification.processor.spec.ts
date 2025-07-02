import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationProcessor } from './notification.processor';
import { NotificationJobData } from './notification.queue';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationProcessor],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('handlePostPublished', () => {
    it('should process post published notification successfully', async () => {
      const mockJob = {
        data: {
          postId: 'post-123',
          organizationId: 'org-123',
          authorId: 'user-123',
          postTitle: 'Test Post',
          notificationType: 'post_published' as const,
          recipients: ['user-123', 'user-456'],
        },
        id: 'job-123',
        opts: {},
        attemptsMade: 0,
        queue: {} as any,
      } as unknown as Job<NotificationJobData>;

      await processor.handlePostPublished(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        'Processing post published notification for post: post-123',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully processed post published notification for post: post-123',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 2 recipients: Post Published: Test Post',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user user-123: Post Published',
      );
    });

    it('should handle errors during post published notification processing', async () => {
      const mockJob = {
        data: {
          postId: 'post-123',
          organizationId: 'org-123',
          authorId: 'user-123',
          postTitle: 'Test Post',
          notificationType: 'post_published' as const,
          recipients: ['user-123'],
        },
        id: 'job-123',
        opts: {},
        attemptsMade: 0,
        queue: {} as any,
      } as unknown as Job<NotificationJobData>;

      // Mock the private method to throw an error
      jest.spyOn(processor as any, 'sendPostPublishedNotification').mockRejectedValue(
        new Error('Email service unavailable')
      );

      await expect(processor.handlePostPublished(mockJob)).rejects.toThrow('Email service unavailable');

      expect(logSpy).toHaveBeenCalledWith(
        'Processing post published notification for post: post-123',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to process post published notification: Email service unavailable',
      );
    });
  });

  describe('handlePostRejected', () => {
    it('should process post rejected notification successfully', async () => {
      const mockJob = {
        data: {
          postId: 'post-123',
          organizationId: 'org-123',
          authorId: 'user-123',
          postTitle: 'Test Post',
          notificationType: 'post_rejected' as const,
          metadata: { rejectionReason: 'Content needs improvement' },
        },
        id: 'job-123',
        opts: {},
        attemptsMade: 0,
        queue: {} as any,
      } as unknown as Job<NotificationJobData>;

      await processor.handlePostRejected(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        'Processing post rejected notification for post: post-123',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully processed post rejected notification for post: post-123',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 1 recipients: Post Rejected: Test Post',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user user-123: Post Rejected',
      );
    });

    it('should handle errors during post rejected notification processing', async () => {
      const mockJob = {
        data: {
          postId: 'post-123',
          organizationId: 'org-123',
          authorId: 'user-123',
          postTitle: 'Test Post',
          notificationType: 'post_rejected' as const,
          metadata: { rejectionReason: 'Content needs improvement' },
        },
        id: 'job-123',
        opts: {},
        attemptsMade: 0,
        queue: {} as any,
      } as unknown as Job<NotificationJobData>;

      // Mock the private method to throw an error
      jest.spyOn(processor as any, 'sendPostRejectedNotification').mockRejectedValue(
        new Error('Notification service down')
      );

      await expect(processor.handlePostRejected(mockJob)).rejects.toThrow('Notification service down');

      expect(logSpy).toHaveBeenCalledWith(
        'Processing post rejected notification for post: post-123',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to process post rejected notification: Notification service down',
      );
    });
  });

  describe('handlePostNeedsReview', () => {
    it('should process post needs review notification successfully', async () => {
      const mockJob = {
        data: {
          postId: 'post-123',
          organizationId: 'org-123',
          authorId: 'user-123',
          postTitle: 'Test Post',
          notificationType: 'post_needs_review' as const,
          recipients: ['editor-1', 'editor-2'],
        },
        id: 'job-123',
        opts: {},
        attemptsMade: 0,
        queue: {} as any,
      } as unknown as Job<NotificationJobData>;

      await processor.handlePostNeedsReview(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        'Processing post needs review notification for post: post-123',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully processed post needs review notification for post: post-123',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 2 recipients: Post Needs Review: Test Post',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user editor-1: Post Needs Review',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user editor-2: Post Needs Review',
      );
    });

    it('should handle errors during post needs review notification processing', async () => {
      const mockJob = {
        data: {
          postId: 'post-123',
          organizationId: 'org-123',
          authorId: 'user-123',
          postTitle: 'Test Post',
          notificationType: 'post_needs_review' as const,
          recipients: ['editor-1'],
        },
        id: 'job-123',
        opts: {},
        attemptsMade: 0,
        queue: {} as any,
      } as unknown as Job<NotificationJobData>;

      // Mock the private method to throw an error
      jest.spyOn(processor as any, 'sendPostNeedsReviewNotification').mockRejectedValue(
        new Error('Editor notification failed')
      );

      await expect(processor.handlePostNeedsReview(mockJob)).rejects.toThrow('Editor notification failed');

      expect(logSpy).toHaveBeenCalledWith(
        'Processing post needs review notification for post: post-123',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to process post needs review notification: Editor notification failed',
      );
    });
  });

  describe('private notification methods', () => {
    it('should simulate email notification correctly', async () => {
      await (processor as any).simulateEmailNotification({
        to: ['user-1', 'user-2'],
        subject: 'Test Subject',
        body: 'Test Body',
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 2 recipients: Test Subject',
      );
    });

    it('should simulate in-app notification correctly', async () => {
      await (processor as any).simulateInAppNotification({
        userId: 'user-123',
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
      });

      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user user-123: Test Title',
      );
    });

    it('should handle post published notification with recipients', async () => {
      await (processor as any).sendPostPublishedNotification({
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_published',
        recipients: ['user-1', 'user-2'],
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 2 recipients: Post Published: Test Post',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user user-123: Post Published',
      );
    });

    it('should handle post rejected notification with rejection reason', async () => {
      await (processor as any).sendPostRejectedNotification({
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_rejected',
        metadata: { rejectionReason: 'Content needs improvement' },
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 1 recipients: Post Rejected: Test Post',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user user-123: Post Rejected',
      );
    });

    it('should handle post needs review notification with multiple editors', async () => {
      await (processor as any).sendPostNeedsReviewNotification({
        postId: 'post-123',
        organizationId: 'org-123',
        authorId: 'user-123',
        postTitle: 'Test Post',
        notificationType: 'post_needs_review',
        recipients: ['editor-1', 'editor-2'],
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Email notification sent to 2 recipients: Post Needs Review: Test Post',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user editor-1: Post Needs Review',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'In-app notification sent to user editor-2: Post Needs Review',
      );
    });
  });
}); 