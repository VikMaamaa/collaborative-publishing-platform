import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExpiresAtToInvitations1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'invitations',
      new TableColumn({
        name: 'expiresAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invitations', 'expiresAt');
  }
} 