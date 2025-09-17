import { useQuery } from '@tanstack/react-query';
import { useAuthState } from './useAuthState';

export function useSubscriptionState() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthState();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["/api/subscriptions/current"],
    enabled: isAuthenticated && user && !authLoading,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const hasActiveSubscription = !!(subscriptionData as any)?.subscription;

  return {
    subscription: (subscriptionData as any)?.subscription || null,
    hasActiveSubscription,
    isLoading,
  };
}