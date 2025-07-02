import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

export interface NotificationJobData {
  postId: string;
  organizationId: string;
  authorId: string;
  postTitle: string;
  notificationType: 'post_published' | 'post_rejected' | 'post_needs_review';
  recipients?: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationQueue {
  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async addNotificationJob(data: NotificationJobData, options?: any) {
    return this.notificationQueue.add(data.notificationType, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
      ...options,
    });
  }

  async addPostPublishedNotification(
    postId: string,
    organizationId: string,
    authorId: string,
    postTitle: string,
    recipients?: string[],
  ) {
    return this.addNotificationJob({
      postId,
      organizationId,
      authorId,
      postTitle,
      notificationType: 'post_published',
      recipients,
    });
  }

  async addPostRejectedNotification(
    postId: string,
    organizationId: string,
    authorId: string,
    postTitle: string,
    rejectionReason: string,
  ) {
    return this.addNotificationJob({
      postId,
      organizationId,
      authorId,
      postTitle,
      notificationType: 'post_rejected',
      metadata: { rejectionReason },
    });
  }

  async addPostNeedsReviewNotification(
    postId: string,
    organizationId: string,
    authorId: string,
    postTitle: string,
    editors: string[],
  ) {
    return this.addNotificationJob({
      postId,
      organizationId,
      authorId,
      postTitle,
      notificationType: 'post_needs_review',
      recipients: editors,
    });
  }

  async getJobCounts() {
    return this.notificationQueue.getJobCounts();
  }

  async getFailedJobs() {
    return this.notificationQueue.getFailed();
  }

  async retryFailedJob(jobId: string) {
    const job = await this.notificationQueue.getJob(jobId);
    if (job) {
      return job.retry();
    }
    throw new Error('Job not found');
  }
} 