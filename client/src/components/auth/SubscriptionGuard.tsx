import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthState } from '@/hooks/useAuthState';
import { useSubscriptionState } from '@/hooks/useSubscriptionState';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiresSubscription?: boolean;
}

export function SubscriptionGuard({ children, requiresSubscription = false }: SubscriptionGuardProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthState();
  const { hasActiveSubscription, isLoading } = useSubscriptionState();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }

    if (!isLoading && requiresSubscription && !hasActiveSubscription) {
      toast({
        title: "Subscription Required",
        description: "Please select a plan to access this feature.",
        variant: "destructive",
      });
      setLocation('/choose-plan');
    }
  }, [isAuthenticated, hasActiveSubscription, isLoading, requiresSubscription, setLocation, toast]);

  if (!isAuthenticated || (requiresSubscription && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (requiresSubscription && !hasActiveSubscription) {
    return null; // Redirect will happen via useEffect
  }

  return <>{children}</>;
}