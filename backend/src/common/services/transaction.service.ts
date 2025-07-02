import { Injectable, Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(DataSource)
    private readonly dataSource: DataSource,
  ) {}

  async executeInTransaction<T>(
    operation: (entityManager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async executeWithRetry<T>(
    operation: (entityManager: EntityManager) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeInTransaction(operation);
      } catch (error) {
        lastError = error;
        
        // Only retry on specific database errors (deadlocks, etc.)
        if (this.isRetryableError(error) && attempt < maxRetries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    // Check for deadlock or serialization errors
    const errorMessage = error.message?.toLowerCase() || '';
    return (
      errorMessage.includes('deadlock') ||
      errorMessage.includes('serialization') ||
      errorMessage.includes('could not serialize')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 