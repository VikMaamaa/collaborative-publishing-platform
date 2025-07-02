import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitationsTable1710000000000 implements MigrationInterface {
  name = 'CreateInvitationsTable1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "email" varchar NOT NULL,
        "role" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "token" varchar NOT NULL,
        "invitedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_invitation_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invitation_invitedBy" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "invitations"');
  }
} 