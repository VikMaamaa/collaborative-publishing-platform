import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Organization } from './organization.entity';

export enum OrganizationRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  WRITER = 'writer',
}

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.WRITER,
  })
  role: OrganizationRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.organizationMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization, (organization) => organization.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Methods
  hasPermission(permission: OrganizationRole): boolean {
    const roleHierarchy = {
      [OrganizationRole.OWNER]: 3,
      [OrganizationRole.EDITOR]: 2,
      [OrganizationRole.WRITER]: 1,
    };

    return roleHierarchy[this.role] >= roleHierarchy[permission];
  }

  isOwner(): boolean {
    return this.role === OrganizationRole.OWNER;
  }

  isEditor(): boolean {
    return this.role === OrganizationRole.EDITOR || this.role === OrganizationRole.OWNER;
  }

  isWriter(): boolean {
    return this.role === OrganizationRole.WRITER || this.isEditor();
  }
} 