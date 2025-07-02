'use client';

import { useRouter } from 'next/navigation';
import Button from './Button';

interface ErrorPageProps {
  title: string;
  message: string;
  code?: string | number;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  icon?: React.ReactNode;
}

export function ErrorPage({ 
  title, 
  message, 
  code, 
  showHomeButton = true, 
  showBackButton = true,
  icon 
}: ErrorPageProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {icon && (
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {icon}
          </div>
        )}
        
        {code && (
          <div className="text-6xl font-bold text-gray-300 mb-4">
            {code}
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        <div className="flex space-x-3">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex-1"
            >
              Go Back
            </Button>
          )}
          {showHomeButton && (
            <Button
              variant="primary"
              onClick={handleGoHome}
              className="flex-1"
            >
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      title="Page Not Found"
      message="The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL."
      code="404"
      icon={
        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
        </svg>
      }
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      title="Server Error"
      message="Something went wrong on our end. We're working to fix the problem. Please try again later."
      code="500"
      icon={
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      }
    />
  );
}

export function UnauthorizedPage() {
  return (
    <ErrorPage
      title="Unauthorized"
      message="You don't have permission to access this page. Please log in with the correct account."
      code="401"
      showBackButton={false}
      icon={
        <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorPage
      title="Access Denied"
      message="You don't have permission to access this resource. Contact your administrator if you believe this is an error."
      code="403"
      showBackButton={false}
      icon={
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      }
    />
  );
}

export function NetworkErrorPage() {
  return (
    <ErrorPage
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      code=""
      icon={
        <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      }
    />
  );
}

export function MaintenancePage() {
  return (
    <ErrorPage
      title="Under Maintenance"
      message="We're currently performing scheduled maintenance. We'll be back shortly. Thank you for your patience."
      code=""
      showBackButton={false}
      icon={
        <svg className="h-8 w-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
    />
  );
} 