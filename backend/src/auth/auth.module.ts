import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TestRbacController } from './test-rbac.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OrganizationGuard } from './guards/organization.guard';
import { AdvancedAuthGuard } from './guards/advanced-auth.guard';
import { AdvancedAuthService } from './services/advanced-auth.service';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    OrganizationsModule,
    PassportModule,
    TypeOrmModule.forFeature([OrganizationMember, Organization, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TestRbacController],
  providers: [
    AuthService, 
    JwtStrategy, 
    LocalStrategy, 
    OrganizationGuard, 
    AdvancedAuthGuard,
    AdvancedAuthService
  ],
  exports: [AuthService, OrganizationGuard, AdvancedAuthGuard, AdvancedAuthService],
})
export class AuthModule {} 