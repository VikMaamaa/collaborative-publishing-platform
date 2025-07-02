import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationJobData } from './notification.queue';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  @Process('post_published')
  async handlePostPublished(job: Job<NotificationJobData>) {
    this.logger.log(`Processing post published notification for post: ${job.data.postId}`);
    
    try {
      // Simulate notification processing
      await this.sendPostPublishedNotification(job.data);
      
      this.logger.log(`Successfully processed post published notification for post: ${job.data.postId}`);
    } catch (error) {
      this.logger.error(`Failed to process post published notification: ${error.message}`);
      throw error;
    }
  }

  @Process('post_rejected')
  async handlePostRejected(job: Job<NotificationJobData>) {
    this.logger.log(`Processing post rejected notification for post: ${job.data.postId}`);
    
    try {
      // Simulate notification processing
      await this.sendPostRejectedNotification(job.data);
      
      this.logger.log(`Successfully processed post rejected notification for post: ${job.data.postId}`);
    } catch (error) {
      this.logger.error(`Failed to process post rejected notification: ${error.message}`);
      throw error;
    }
  }

  @Process('post_needs_review')
  async handlePostNeedsReview(job: Job<NotificationJobData>) {
    this.logger.log(`Processing post needs review notification for post: ${job.data.postId}`);
    
    try {
      // Simulate notification processing
      await this.sendPostNeedsReviewNotification(job.data);
      
      this.logger.log(`Successfully processed post needs review notification for post: ${job.data.postId}`);
    } catch (error) {
      this.logger.error(`Failed to process post needs review notification: ${error.message}`);
      throw error;
    }
  }

  private async sendPostPublishedNotification(data: NotificationJobData): Promise<void> {
    // Simulate sending email notification
    await this.simulateEmailNotification({
      to: data.recipients || [],
      subject: `Post Published: ${data.postTitle}`,
      body: `Your post "${data.postTitle}" has been published successfully!`,
    });

    // Simulate sending in-app notification
    await this.simulateInAppNotification({
      userId: data.authorId,
      title: 'Post Published',
      message: `Your post "${data.postTitle}" has been published.`,
      type: 'success',
    });
  }

  private async sendPostRejectedNotification(data: NotificationJobData): Promise<void> {
    const rejectionReason = data.metadata?.rejectionReason || 'No reason provided';

    // Simulate sending email notification
    await this.simulateEmailNotification({
      to: [data.authorId],
      subject: `Post Rejected: ${data.postTitle}`,
      body: `Your post "${data.postTitle}" has been rejected. Reason: ${rejectionReason}`,
    });

    // Simulate sending in-app notification
    await this.simulateInAppNotification({
      userId: data.authorId,
      title: 'Post Rejected',
      message: `Your post "${data.postTitle}" has been rejected. Reason: ${rejectionReason}`,
      type: 'error',
    });
  }

  private async sendPostNeedsReviewNotification(data: NotificationJobData): Promise<void> {
    // Simulate sending email notification to editors
    await this.simulateEmailNotification({
      to: data.recipients || [],
      subject: `Post Needs Review: ${data.postTitle}`,
      body: `A new post "${data.postTitle}" has been submitted for review.`,
    });

    // Simulate sending in-app notification to editors
    for (const editorId of data.recipients || []) {
      await this.simulateInAppNotification({
        userId: editorId,
        title: 'Post Needs Review',
        message: `A new post "${data.postTitle}" has been submitted for review.`,
        type: 'info',
      });
    }
  }

  private async simulateEmailNotification(data: {
    to: string[];
    subject: string;
    body: string;
  }): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.log(`Email notification sent to ${data.to.length} recipients: ${data.subject}`);
  }

  private async simulateInAppNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }): Promise<void> {
    // Simulate in-app notification delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.logger.log(`In-app notification sent to user ${data.userId}: ${data.title}`);
  }
} 