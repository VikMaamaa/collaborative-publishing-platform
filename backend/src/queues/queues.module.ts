import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationQueue } from './notification.queue';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  providers: [NotificationQueue, NotificationProcessor],
  exports: [NotificationQueue],
})
export class QueuesModule {} 