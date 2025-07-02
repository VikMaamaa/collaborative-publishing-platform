import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DataSource } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { TRANSACTION_KEY } from '../decorators/transaction.decorator';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @Inject(DataSource)
    private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isTransaction = this.reflector.get<boolean>(
      TRANSACTION_KEY,
      context.getHandler(),
    );

    if (!isTransaction) {
      return next.handle();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Inject the transaction manager into the request
      const request = context.switchToHttp().getRequest();
      request.transactionManager = queryRunner.manager;

      const result = await next.handle().toPromise();

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 