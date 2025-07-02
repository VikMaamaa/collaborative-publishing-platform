import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationMember } from './organization-member.entity';
import { User } from '../users/user.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UsersModule } from '../users/users.module';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { Invitation } from './invitation.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, User, Invitation]),
    UsersModule,
    RealtimeModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationGuard],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {} 