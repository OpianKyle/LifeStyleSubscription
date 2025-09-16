import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import ChoosePlan from "@/pages/choose-plan";
import Dashboard from "@/pages/dashboard";
import SubscriptionForm from "@/pages/subscription-form";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscriptionState();

  if (authLoading || (isAuthenticated && subscriptionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/verify-email" component={Auth} />
      <Route path="/reset-password" component={Auth} />
      
      {/* Routes for authenticated users - show these routes regardless of auth state to prevent 404s */}
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Auth />}
      </Route>
      <Route path="/choose-plan">
        {isAuthenticated ? <ChoosePlan /> : <Auth />}
      </Route>
      <Route path="/pricing">
        {isAuthenticated ? <ChoosePlan /> : <Auth />}
      </Route>
      <Route path="/subscription-form/:planId">
        {isAuthenticated ? <SubscriptionForm /> : <Auth />}
      </Route>
      {user?.role === 'ADMIN' && (
        <Route path="/admin">
          {isAuthenticated ? <Admin /> : <Auth />}
        </Route>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
