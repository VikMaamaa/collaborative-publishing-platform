import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../users/user.entity';
import { OrganizationRole } from './organization-member.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  email: string;

  @Column({ 
    type: 'enum', 
    enum: OrganizationRole,
    enumName: 'organization_role'
  })
  role: OrganizationRole;

  @Column({ 
    type: 'enum', 
    enum: InvitationStatus, 
    default: InvitationStatus.PENDING,
    enumName: 'invitation_status'
  })
  status: InvitationStatus;

  @Column()
  token: string;

  @Column({ nullable: true })
  invitedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, (org) => org.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invitedBy' })
  inviter?: User;
} 