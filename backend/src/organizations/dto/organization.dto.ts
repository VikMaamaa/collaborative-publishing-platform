import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsUUID, IsEnum, IsUrl } from 'class-validator';
import { OrganizationRole } from '../organization-member.entity';
import { InvitationStatus } from '../invitation.entity';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corporation',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description: 'Organization description',
    example: 'A leading technology company',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Organization website URL',
    example: 'https://acme.com',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Acme Corporation Updated',
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Organization description',
    example: 'A leading technology company with updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Organization website URL',
    example: 'https://acme-updated.com',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;
}

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'newmember@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Role to assign to the invited member',
    enum: OrganizationRole,
    example: OrganizationRole.WRITER,
  })
  @IsEnum(OrganizationRole)
  role: OrganizationRole = OrganizationRole.WRITER;
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role for the member',
    enum: OrganizationRole,
    example: OrganizationRole.EDITOR,
  })
  @IsUUID()
  memberId: string;

  @ApiProperty({
    description: 'New role for the member',
    enum: OrganizationRole,
    example: OrganizationRole.EDITOR,
  })
  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}

export class RemoveMemberDto {
  @ApiProperty({
    description: 'ID of the member to remove',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  memberId: string;
}

export class OrganizationResponse {
  @ApiProperty({
    description: 'Organization unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Organization description',
    example: 'A leading technology company',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Organization website URL',
    example: 'https://acme.com',
  })
  website?: string;

  @ApiProperty({
    description: 'Whether the organization is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Organization creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Member count',
    example: 10,
  })
  memberCount?: number;
}

export class MemberResponse {
  @ApiProperty({
    description: 'Member unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID of the member',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Member role in the organization',
    enum: OrganizationRole,
    example: OrganizationRole.EDITOR,
  })
  role: OrganizationRole;

  @ApiProperty({
    description: 'Whether the member is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Member creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'User information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'member@example.com',
      username: 'member',
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  user?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address to invite', example: 'invitee@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Role to assign', enum: OrganizationRole, example: OrganizationRole.WRITER })
  @IsEnum(OrganizationRole)
  role: OrganizationRole = OrganizationRole.WRITER;
}

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token',
    example: 'abc123def456...',
  })
  @IsString()
  token: string;
}

export class InvitationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: OrganizationRole })
  role: OrganizationRole;

  @ApiProperty({ enum: InvitationStatus })
  status: InvitationStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  invitedBy?: string;

  @ApiPropertyOptional()
  expiresAt?: Date;
} 