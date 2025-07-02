import RegisterForm from '@/components/auth/RegisterForm';
import { ErrorBoundary } from '@/components/ui';

export default function RegisterPage() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong with the registration form.</div>}>
      <RegisterForm />
    </ErrorBoundary>
  );
} 