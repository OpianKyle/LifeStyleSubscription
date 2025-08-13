import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PlanCard from "@/components/pricing/plan-card";
import PaymentForm from "@/components/payment/payment-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthState();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);

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
        title: "Plan Updated Successfully",
        description: "Your subscription plan has been updated.",
      });
      setSelectedPlan(null);
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
    if (!isAuthenticated) {
      setLocation('/auth');
      toast({
        title: "Authentication Required",
        description: "Please sign in to select a plan.",
        variant: "destructive",
      });
      return;
    }

    // Find the selected plan details
    const plan = plans.find((p: any) => p.name === planName);
    if (!plan) return;

    // Check if this is a development plan (skip payment) or production (require payment)
    const isDevelopmentPlan = plan.stripePriceId && plan.stripePriceId.startsWith('price_dev_');
    
    if (isDevelopmentPlan) {
      // Development mode: Direct subscription creation
      setSelectedPlan(planName);
      try {
        await createSubscriptionMutation.mutateAsync(planName);
      } catch (error) {
        setSelectedPlan(null);
      }
    } else {
      // Production mode: Show payment form
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
      description: "Your subscription has been activated successfully!",
    });
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPaymentPlan(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  const plans = (plansData as any)?.plans || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <section className="pricing-gradient pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Choose Your Perfect 
              <span className="bg-gradient-to-r from-brand-500 to-indigo-600 bg-clip-text text-transparent"> Protection Plan</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Select the ideal coverage for your lifestyle and budget. All plans include our core protection services with varying coverage levels and benefits.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map((plan: any, index: number) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                featured={plan.name === 'PROSPER'}
                onSelect={handleSelectPlan}
                disabled={createSubscriptionMutation.isPending && selectedPlan === plan.name}
                isCurrentPlan={(currentSubscription as any)?.subscription?.plan?.name === plan.name}
                loading={createSubscriptionMutation.isPending && selectedPlan === plan.name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          {paymentPlan && (
            <PaymentForm
              planName={paymentPlan.name}
              planPrice={paymentPlan.price}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Features Comparison */}
      <section className="py-20 pricing-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose LifeGuard?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Every plan includes comprehensive protection designed for South African families.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 Support</h3>
              <p className="text-slate-600">Round-the-clock assistance when you need it most, with dedicated support teams ready to help.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Nationwide Coverage</h3>
              <p className="text-slate-600">Complete protection across South Africa with trusted service providers and medical facilities.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Activation</h3>
              <p className="text-slate-600">Your protection starts immediately after payment, with no waiting periods or delays.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
