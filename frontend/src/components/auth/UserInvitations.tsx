'use client';

import { useEffect } from 'react';
import { useOrganizationsWithNotifications, useUI } from '@/lib/hooks';
import { Button, Card, Badge, SkeletonList } from '@/components/ui';
import { ROLES } from '@/lib/store';

export default function UserInvitations() {
  const { 
    userInvitations, 
    isLoadingInvitations,
    loadUserInvitations,
    acceptInvitationWithNotification 
  } = useOrganizationsWithNotifications();
  const { } = useUI();

  useEffect(() => {
    loadUserInvitations();
  }, [loadUserInvitations]);

  const handleAcceptInvitation = async (token: string, organizationName: string) => {
    try {
      await acceptInvitationWithNotification(token);
    } catch (error: any) {
      // Error handling is now done in the enhanced hook
      throw error;
    }
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
      <Card>
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <SkeletonList items={3} />
        </div>
      </Card>
    );
  }

  if (userInvitations.length === 0) {
    return null;
  }

  const pendingInvitations = userInvitations.filter(inv => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Invitations ({pendingInvitations.length})
        </h3>
        
        <div className="space-y-4">
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
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Invitation to join organization
                  </p>
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
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id, 'Organization')}
                  disabled={isExpired(invitation.expiresAt)}
                >
                  {isExpired(invitation.expiresAt) ? 'Expired' : 'Accept Invitation'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 