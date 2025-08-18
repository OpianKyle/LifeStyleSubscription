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
import { ArrowLeft, Check, Loader2, Shield } from "lucide-react";

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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      toast({
        title: "Plan Updated Successfully",
        description: data.message || "Your subscription has been activated. Welcome to your new plan!",
      });
      setSelectedPlan(null);
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      setSelectedPlan(null);
    },
  });

  const handleSelectPlan = async (planName: string) => {
    // Find the selected plan details
    const plan = ((plansData as any)?.plans || []).find((p: any) => p.name === planName);
    if (!plan) return;

    // Check if user already has this plan
    const currentPlan = (currentSubscription as any)?.subscription?.plan.name;
    if (currentPlan === planName) {
      toast({
        title: "Already Subscribed",
        description: `You are already subscribed to the ${planName} plan.`,
        variant: "destructive",
      });
      return;
    }

    // Set selected plan and trigger the mutation directly for development mode
    setSelectedPlan(planName);
    
    // Since we're in development mode, directly create/update subscription
    try {
      await createSubscriptionMutation.mutateAsync(planName);
    } catch (error) {
      // Error is already handled in the mutation's onError
      console.error('Subscription creation failed:', error);
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
          {/* Header with Stained Glass Effect */}
          <div className="relative overflow-hidden rounded-2xl p-12 mb-12">
            {/* Stained Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/90 via-blue-100/70 to-indigo-200/85"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-200/60 via-transparent to-cyan-200/50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-transparent to-purple-100/55"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/40 via-transparent to-blue-100/45"></div>
            
            {/* Glass overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
            
            {/* Content */}
            <div className="relative z-10 text-center">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="mb-6 text-slate-700 hover:text-slate-900 bg-white/30 backdrop-blur-sm border border-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Choose Your Protection Plan
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
                Select the plan that best fits your needs. You can always upgrade or change your plan later.
              </p>
              
              {user && (
                <div className="mt-6 p-4 bg-white/40 backdrop-blur-sm border border-white/30 rounded-lg inline-block">
                  <div className="flex items-center text-slate-800">
                    <Check className="w-5 h-5 mr-2 text-emerald-600" />
                    <span>Signed in as <strong>{user.name}</strong> ({user.email})</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Subscription Status */}
          {(currentSubscription as any)?.subscription && (
            <Card className="mb-8 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader>
                <CardTitle className="text-emerald-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-emerald-800 text-lg">
                    You currently have the <strong className="text-emerald-900">{(currentSubscription as any).subscription.plan.name}</strong> plan.
                    You can upgrade or change your plan below.
                  </p>
                </div>
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