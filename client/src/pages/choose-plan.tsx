import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PlanCard from "@/components/pricing/plan-card";
import PaymentForm from "@/components/payment/payment-form";
import { useAuthState } from "@/hooks/useAuthState";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

export default function ChoosePlan() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthState();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to choose a plan.",
        variant: "destructive",
      });
      setLocation('/auth?redirect=/choose-plan');
    }
  }, [isAuthenticated, authLoading, setLocation, toast]);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["/api/plans"],
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscriptions/current"],
    enabled: isAuthenticated,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planName: string) => {
      const response = await apiRequest("POST", "/api/subscriptions/create", { planName });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      toast({
        title: "Plan Selected Successfully",
        description: "Your subscription has been activated. Welcome to your new plan!",
      });
      setSelectedPlan(null);
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = async (planName: string) => {
    // Find the selected plan details
    const plan = ((plansData as any)?.plans || []).find((p: any) => p.name === planName);
    if (!plan) return;

    // Check if this is a development plan (skip payment) or production (require payment)
    const isDevelopmentPlan = plan.price === 0 || process.env.NODE_ENV === 'development';
    
    if (isDevelopmentPlan) {
      // Development mode: create subscription directly
      setSelectedPlan(planName);
      createSubscriptionMutation.mutate(planName);
    } else {
      // Production mode: show payment form
      setPaymentPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentPlan(null);
    queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
    toast({
      title: "Subscription Activated",
      description: "Your subscription has been activated successfully.",
    });
    setLocation('/dashboard');
  };

  const plans = (plansData as any)?.plans || [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="mb-6 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Choose Your Protection Plan
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Select the plan that best fits your needs. You can always upgrade or change your plan later.
            </p>
            
            {user && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
                <div className="flex items-center text-green-800">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Signed in as {user.name} ({user.email})</span>
                </div>
              </div>
            )}
          </div>

          {/* Current Subscription Status */}
          {(currentSubscription as any)?.subscription && (
            <Card className="mb-8 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800">
                  You currently have the <strong>{(currentSubscription as any).subscription.plan.name}</strong> plan.
                  You can upgrade or change your plan below.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Plans Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {plans.map((plan: any) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                  loading={createSubscriptionMutation.isPending && selectedPlan === plan.name}
                  isCurrentPlan={(currentSubscription as any)?.subscription?.plan.name === plan.name}
                />
              ))}
            </div>
          )}

          {/* Help Section */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Need Help Choosing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Not sure which plan is right for you? Here's a quick guide:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li><strong>OPPORTUNITY:</strong> Perfect for individuals needing basic protection</li>
                <li><strong>MOMENTUM:</strong> Great for growing families with increased coverage</li>
                <li><strong>PROSPER:</strong> Comprehensive protection for established families</li>
                <li><strong>PRESTIGE:</strong> Premium coverage with superior benefits</li>
                <li><strong>PINNACLE:</strong> Ultimate protection with maximum coverage</li>
              </ul>
              <div className="mt-6">
                <Button variant="outline" onClick={() => setLocation('/')}>
                  View Detailed Comparison
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          {paymentPlan && (
            <PaymentForm
              planName={paymentPlan.name}
              planPrice={paymentPlan.price}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPaymentModal(false);
                setPaymentPlan(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}