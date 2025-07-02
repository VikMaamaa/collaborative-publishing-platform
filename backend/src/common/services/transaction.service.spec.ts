import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let dataSource: DataSource;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {} as EntityManager,
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeInTransaction', () => {
    it('should execute operation successfully within transaction', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const expectedResult = 'success';

      const result = await service.executeInTransaction(mockOperation);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockOperation).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Database error');
      const mockOperation = jest.fn().mockRejectedValue(mockError);

      await expect(service.executeInTransaction(mockOperation)).rejects.toThrow(mockError);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockOperation).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should release query runner even if operation throws', async () => {
      const mockError = new Error('Database error');
      const mockOperation = jest.fn().mockRejectedValue(mockError);

      try {
        await service.executeInTransaction(mockOperation);
      } catch (error) {
        // Expected to throw
      }

      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const expectedResult = 'success';

      const result = await service.executeWithRetry(mockOperation);

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedResult);
    });

    it('should retry on retryable errors and succeed', async () => {
      const mockError = new Error('deadlock detected');
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce('success');

      const result = await service.executeWithRetry(mockOperation, 2);

      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should fail after max retries on retryable errors', async () => {
      const mockError = new Error('deadlock detected');
      const mockOperation = jest.fn().mockRejectedValue(mockError);

      await expect(service.executeWithRetry(mockOperation, 2)).rejects.toThrow(mockError);

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockError = new Error('permission denied');
      const mockOperation = jest.fn().mockRejectedValue(mockError);

      await expect(service.executeWithRetry(mockOperation, 3)).rejects.toThrow(mockError);

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff between retries', async () => {
      const mockError = new Error('serialization failure');
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await service.executeWithRetry(mockOperation, 2);
      const endTime = Date.now();

      // Should have at least 200ms delay (2^1 * 100)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });
  });

  describe('isRetryableError', () => {
    it('should identify deadlock errors as retryable', () => {
      const error = new Error('deadlock detected');
      expect(service['isRetryableError'](error)).toBe(true);
    });

    it('should identify serialization errors as retryable', () => {
      const error = new Error('could not serialize access');
      expect(service['isRetryableError'](error)).toBe(true);
    });

    it('should identify serialization failure errors as retryable', () => {
      const error = new Error('serialization failure');
      expect(service['isRetryableError'](error)).toBe(true);
    });

    it('should not identify other errors as retryable', () => {
      const error = new Error('permission denied');
      expect(service['isRetryableError'](error)).toBe(false);
    });

    it('should handle errors without message', () => {
      const error = {};
      expect(service['isRetryableError'](error)).toBe(false);
    });
  });
}); 