'use client';

import { useState } from 'react';
import { useUI } from '@/lib/hooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadOrganizationInvitations } from '@/store/organizationsSlice';
import { Button, Input } from '@/components/ui';
import { ROLES } from '@/constants/roles';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

interface FormData {
  email: string;
  role: string;
}

interface FormErrors {
  email?: string;
  role?: string;
  general?: string;
}

export default function InviteMemberModal({ isOpen, onClose, organizationId }: InviteMemberModalProps) {
  const dispatch = useAppDispatch();
  const { } = useUI();
  
  const [invites, setInvites] = useState([{ email: '', role: ROLES.VIEWER }]);
  const [inviteErrors, setInviteErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const validateInvites = () => {
    const errs = invites.map((invite) => {
      const e: any = {};
      if (!invite.email.trim()) e.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(invite.email.trim())) e.email = 'Invalid email';
      if (!invite.role) e.role = 'Role is required';
      return e;
    });
    setInviteErrors(errs);
    return errs.every(e => Object.keys(e).length === 0);
  };

  const handleInviteChange = (idx: number, field: 'email' | 'role', value: string) => {
    setInvites(invites.map((invite, i) => i === idx ? { ...invite, [field]: value } : invite));
    setInviteErrors(inviteErrors.map((e, i) => i === idx ? { ...e, [field]: undefined } : e));
  };
  const handleAddInvite = () => setInvites([...invites, { email: '', role: ROLES.VIEWER }]);
  const handleRemoveInvite = (idx: number) => setInvites(invites.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults(null);
    if (!validateInvites()) return;
    setIsSubmitting(true);
    const res: any[] = [];
    for (const [idx, invite] of invites.entries()) {
      try {
        await dispatch(loadOrganizationInvitations({
          orgId: organizationId,
          email: invite.email.trim(),
          role: invite.role as any,
        }));
        res.push({ email: invite.email, status: 'success' });
      } catch (error: any) {
        res.push({ email: invite.email, status: 'error', message: error.message });
      }
    }
    setResults(res);
    setIsSubmitting(false);
    // Show summary notification
    const successCount = res.filter(r => r.status === 'success').length;
    const errorCount = res.filter(r => r.status === 'error').length;
    if (successCount) console.log(`Invited ${successCount} member(s) successfully.`);
    if (errorCount) console.log(`${errorCount} invitation(s) failed.`);
    // Optionally reset form if all succeeded
    if (errorCount === 0) {
      setInvites([{ email: '', role: ROLES.VIEWER }]);
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setInvites([{ email: '', role: ROLES.VIEWER }]);
      setInviteErrors([]);
      setResults(null);
      onClose();
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case ROLES.OWNER:
        return 'Full access to all features and settings';
      case ROLES.EDITOR:
        return 'Can edit posts, manage members, and moderate content';
      case ROLES.WRITER:
        return 'Can create and edit their own posts';
      case ROLES.VIEWER:
        return 'Can view posts and content only';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Invite Team Members
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Send invitations to join your organization.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {results && (
                <div className="mb-2">
                  {results.map((r, idx) => (
                    <div key={idx} className={r.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                      {r.email}: {r.status === 'success' ? 'Invited!' : `Failed (${r.message})`}
                    </div>
                  ))}
                </div>
              )}
              {invites.map((invite, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    label="Email"
                    type="email"
                    value={invite.email}
                    onChange={e => handleInviteChange(idx, 'email', e.target.value)}
                    error={inviteErrors[idx]?.email}
                    placeholder="Email address"
                    required
                    className="flex-1"
                  />
                  <select
                    value={invite.role}
                    onChange={e => handleInviteChange(idx, 'role', e.target.value)}
                    className={`border rounded p-2 ${
                      inviteErrors[idx]?.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value={ROLES.OWNER}>Owner</option>
                    <option value={ROLES.EDITOR}>Editor</option>
                    <option value={ROLES.WRITER}>Writer</option>
                    <option value={ROLES.VIEWER}>Viewer</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveInvite(idx)}
                    disabled={invites.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddInvite}
                >
                  Add Another
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                >
                  Send Invitations
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 