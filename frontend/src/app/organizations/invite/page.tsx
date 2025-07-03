'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { inviteMember } from '@/store/organizationsSlice';
import { Button, Input, Card } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import DashboardLayout, { DashboardSection } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function InviteMembersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const activeOrganization = useAppSelector(state => state.organizations.activeOrganization);

  const [invites, setInvites] = useState([{ email: '', role: ROLES.VIEWER }]);
  const [inviteErrors, setInviteErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">No active organization selected.</div>
      </DashboardLayout>
    );
  }

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
    for (const invite of invites) {
      try {
        await dispatch(inviteMember({
          organizationId: activeOrganization.id,
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
    // Optionally reset form if all succeeded
    const errorCount = res.filter(r => r.status === 'error').length;
    if (errorCount === 0) {
      setInvites([{ email: '', role: ROLES.VIEWER }]);
      // Optionally redirect or show a success message
      router.push(`/organizations`);
    }
  };

  return (
    <DashboardLayout>
      <DashboardSection 
        title="Invite Team Members"
        subtitle={`Invite people to join your organization (${activeOrganization.name}) and assign their roles.`}
      >
        <Card>
          <div className="p-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className={`border rounded p-2 ${inviteErrors[idx]?.role ? 'border-red-300' : 'border-gray-300'}`}
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
                  onClick={() => router.push(`/organizations`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </DashboardSection>
    </DashboardLayout>
  );
} 