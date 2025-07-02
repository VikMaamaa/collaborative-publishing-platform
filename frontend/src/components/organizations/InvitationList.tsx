'use client';

import { useEffect } from 'react';
import { useOrganizationsWithNotifications, useUI } from '@/lib/hooks';
import { Button, Badge, SkeletonList } from '@/components/ui';
import { ROLES } from '@/lib/store';

interface InvitationListProps {
  organizationId: string;
}

export default function InvitationList({ organizationId }: InvitationListProps) {
  const { 
    organizationInvitations, 
    isLoadingInvitations,
    loadOrganizationInvitations,
    resendInvitationWithNotification, 
    cancelInvitationWithConfirmation 
  } = useOrganizationsWithNotifications();
  const { } = useUI();

  useEffect(() => {
    if (organizationId) {
      loadOrganizationInvitations(organizationId);
    }
  }, [organizationId, loadOrganizationInvitations]);

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      await resendInvitationWithNotification(organizationId, invitationId);
    } catch (error: any) {
      // Error handling is now done in the enhanced hook
      throw error;
    }
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    cancelInvitationWithConfirmation(organizationId, invitationId, email);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoadingInvitations) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <SkeletonList items={3} />
      </div>
    );
  }

  if (organizationInvitations.length === 0) {
    return null; // Don't show anything if no pending invitations
  }

  const pendingInvitations = organizationInvitations.filter(inv => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Pending Invitations ({pendingInvitations.length})
      </h3>
      
      <div className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
              isExpired(invitation.expiresAt) 
                ? 'border-orange-200 bg-orange-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {invitation.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{invitation.email}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Invited {formatDate(invitation.createdAt)}</span>
                  {invitation.expiresAt && (
                    <>
                      <span>•</span>
                      <span className={isExpired(invitation.expiresAt) ? 'text-orange-600' : 'text-gray-500'}>
                        {isExpired(invitation.expiresAt) 
                          ? 'Expired' 
                          : `Expires ${formatDate(invitation.expiresAt)}`
                        }
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant={getRoleBadgeColor(invitation.role)}>
                {invitation.role}
              </Badge>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                  disabled={isExpired(invitation.expiresAt)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Resend
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 