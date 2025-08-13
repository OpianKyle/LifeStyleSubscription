import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  CreditCard, 
  MessageCircle, 
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthState();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/auth");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscriptions/current"],
    enabled: isAuthenticated,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscriptions/cancel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled and will end at the current period.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/auth");
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (planName: string) => {
      const response = await apiRequest("POST", "/api/subscriptions/update", { planName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/auth");
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const subscription = subscriptionData?.subscription;
  const invoices = invoicesData?.invoices || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <section className="pricing-gradient pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="text-user-name">
                  Welcome, {user.name}
                </h1>
                <p className="text-slate-600" data-testid="text-user-email">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {subscription?.status === 'ACTIVE' ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-200 text-amber-800">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {subscription?.status || 'No Subscription'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Current Plan */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border border-slate-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-brand-600" />
                    <span>Current Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="text-2xl font-bold text-brand-600" data-testid="text-current-plan">
                            {subscription.plan.name}
                          </div>
                          <div className="text-slate-600" data-testid="text-current-price">
                            R{subscription.plan.price}/month
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500">Next billing</div>
                          <div className="font-medium text-slate-900" data-testid="text-next-billing">
                            {subscription.currentPeriodEnd 
                              ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                              : 'Not set'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Plan Features</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subscription.plan.features?.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setLocation('/pricing')}
                          data-testid="button-change-plan"
                        >
                          Change Plan
                        </Button>
                        {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
                          <Button 
                            variant="outline" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => cancelSubscriptionMutation.mutate()}
                            disabled={cancelSubscriptionMutation.isPending}
                            data-testid="button-cancel-subscription"
                          >
                            {cancelSubscriptionMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
                          </Button>
                        )}
                      </div>
                      
                      {subscription.cancelAtPeriodEnd && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-amber-800">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Subscription Canceled</span>
                          </div>
                          <p className="text-sm text-amber-700 mt-1">
                            Your subscription will end on {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Subscription</h3>
                      <p className="text-slate-600 mb-6">Choose a plan to get started with LifeGuard protection.</p>
                      <Button 
                        className="btn-primary"
                        onClick={() => setLocation('/pricing')}
                        data-testid="button-choose-plan"
                      >
                        Choose a Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions */}
            <div>
              <Card className="shadow-sm border border-slate-200/60">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="button-download-invoices"
                  >
                    <Download className="w-5 h-5 mr-3 text-slate-500" />
                    Download Invoices
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="button-update-payment"
                  >
                    <CreditCard className="w-5 h-5 mr-3 text-slate-500" />
                    Update Payment Method
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    data-testid="button-contact-support"
                  >
                    <MessageCircle className="w-5 h-5 mr-3 text-slate-500" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent Invoices */}
          <Card className="mt-8 shadow-sm border border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-brand-600" />
                <span>Recent Invoices</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Date</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Amount</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Status</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b border-slate-100">
                          <td className="py-3 text-sm text-slate-900" data-testid={`text-invoice-date-${invoice.id}`}>
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-sm text-slate-900" data-testid={`text-invoice-amount-${invoice.id}`}>
                            R{parseFloat(invoice.amount).toFixed(2)}
                          </td>
                          <td className="py-3">
                            <Badge 
                              className={
                                invoice.status === 'paid' 
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }
                            >
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-brand-600 hover:text-brand-700"
                              data-testid={`button-download-invoice-${invoice.id}`}
                            >
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Invoices Yet</h3>
                  <p className="text-slate-600">Your invoice history will appear here once you have an active subscription.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
