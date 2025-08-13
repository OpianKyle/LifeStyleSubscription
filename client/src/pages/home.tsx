import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PlanCard from "@/components/pricing/plan-card";
import PaymentForm from "@/components/payment/payment-form";
import { useAuthState } from "@/hooks/useAuthState";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Shield, Heart, Phone, Scale, Users, Check, Loader2 } from "lucide-react";

export default function Home() {
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
  };

  const plans = plansData?.plans || [];

  const features = [
    {
      icon: Phone,
      title: "Emergency Medical Services",
      description: "24/7 emergency medical assistance with rapid response times and professional medical teams ready to help when you need it most."
    },
    {
      icon: Scale,
      title: "Legal Assistance", 
      description: "Professional legal support and consultation services to help you navigate complex legal matters with expert guidance."
    },
    {
      icon: Heart,
      title: "Family Protection",
      description: "Comprehensive family coverage including funeral assist, income benefits, and support services for your loved ones."
    }
  ];

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Santander Style */}
      <section className="santander-hero pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Life Protection
              <br />
              <span className="text-white/90">That Matters</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-2xl">
              Comprehensive lifestyle protection for South African families. From emergency medical services to legal assistance - we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Button 
                className="btn-outline text-lg"
                onClick={scrollToPricing}
                data-testid="button-view-plans"
              >
                Choose Your Plan
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">24/7</div>
              <div className="text-lg text-slate-600">Emergency Support</div>
            </div>
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">5</div>
              <div className="text-lg text-slate-600">Protection Plans</div>
            </div>
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">R350</div>
              <div className="text-lg text-slate-600">Starting From</div>
            </div>
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">100%</div>
              <div className="text-lg text-slate-600">Coverage Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Corporate Style */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Protection Services That Make a Difference</h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              We deliver comprehensive lifestyle protection through innovative services designed specifically for South African families and their unique needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center" data-testid={`feature-${index}`}>
                <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-lg">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-lg text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete Pricing Section - Corporate Style */}
      <section id="pricing" className="py-24 pricing-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Choose Your Protection Plan</h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Designed for South African families, our protection plans provide comprehensive coverage with transparent pricing and immediate activation. Select the plan that best fits your lifestyle and budget.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
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
          )}

          <div className="mt-20">
            <div className="bg-white rounded-3xl p-12 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-brand-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Comprehensive Coverage</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">All plans include essential protection services with varying coverage levels and benefits tailored for your needs.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-brand-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Family Focused</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">Protect your entire family with coverage that includes spouse and children benefits across all plans.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-brand-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Instant Activation</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">Your protection starts immediately after payment, with no waiting periods or delays - just instant peace of mind.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          {paymentPlan && (
            <PaymentForm
              planName={paymentPlan.name}
              planPrice={paymentPlan.price}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
