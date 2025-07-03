'use client';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useUI, usePermissions } from '@/lib/hooks';
import { Button, Card, Badge, SkeletonList } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import React, { useState } from 'react';
import InvitationList from './InvitationList';

export default function OrganizationMembers() {
  const activeOrganization = useAppSelector(state => state.organizations.activeOrganization);
  const dispatch = useAppDispatch();
  const { openModal } = useUI();
  const { canInviteMembers, hasRole, userRole } = usePermissions();
  const members = activeOrganization?.members || [];

  const handleInviteMember = () => {
    openModal('inviteMember');
  };

  if (!activeOrganization) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          Please select an organization to view members.
        </div>
      </Card>
    );
  }

  // Show loading skeleton while data is being fetched
  if (!members || members.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Organization Members
          </h2>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">
              {userRole || 'viewer'}
            </Badge>
            {canInviteMembers() && (
              <Button
                variant="primary"
                onClick={handleInviteMember}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              >
                Invite Member
              </Button>
            )}
          </div>
        </div>
        <SkeletonList items={3} />
      </div>
    );
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      // You may want to implement updateMemberRole logic here
      // await updateMemberRole(activeOrganization.id, userId, newRole);
    } catch (error: any) {
      throw error;
    }
  };

  const handleRemoveMember = (userId: string, memberName: string) => {
    // You may want to implement removeMemberWithConfirmation logic here
    // removeMemberWithConfirmation(activeOrganization.id, userId, memberName);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case ROLES.OWNER:
        return 'error';
      case ROLES.EDITOR:
        return 'primary';
      case ROLES.WRITER:
        return 'success';
      case ROLES.VIEWER:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Organization Members
        </h2>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary">
            {userRole || 'viewer'}
          </Badge>
          {canInviteMembers() && (
            <Button
              variant="primary"
              onClick={handleInviteMember}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            >
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      <InvitationList organizationId={activeOrganization.id} />
      {/* Members List */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Members ({members.length})
          </h3>
          {members.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No members yet</p>
              <p className="text-gray-600 mb-4">
                Invite team members to start collaborating on your organization.
              </p>
              {canInviteMembers() && (
                <Button
                  variant="primary"
                  onClick={handleInviteMember}
                >
                  Invite Your First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {member.user?.firstName?.charAt(0).toUpperCase() || member.user?.email?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.firstName && member.user?.lastName 
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.user?.username || member.user?.email || 'Unnamed User'
                        }
                      </p>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 