import LoginForm from '@/components/auth/LoginForm';
import { ErrorBoundary } from '@/components/ui';

export default function LoginPage() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong with the login form.</div>}>
      <LoginForm />
    </ErrorBoundary>
  );
} 