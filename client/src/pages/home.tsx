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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-gradient pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Comprehensive 
              <span className="bg-gradient-to-r from-brand-500 to-indigo-600 bg-clip-text text-transparent"> Lifestyle Protection</span>
              for Every Journey
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              From emergency medical services to legal assistance, our comprehensive plans provide peace of mind for you and your family with 24/7 support and nationwide coverage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="btn-primary px-8 py-4 text-lg"
                onClick={scrollToPricing}
                data-testid="button-view-plans"
              >
                View Plans & Pricing
              </Button>
              <Button 
                variant="ghost" 
                className="text-brand-600 hover:text-brand-700 font-semibold text-lg flex items-center space-x-2"
                data-testid="button-learn-more"
              >
                <span>Learn More</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need, All in One Place</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Our comprehensive protection plans include essential services to keep you and your family safe and secure.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card card-hover" data-testid={`card-feature-${index}`}>
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Complete Pricing Section */}
      <section id="pricing" className="py-20 pricing-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choose Your Protection Plan</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Select the perfect plan for your lifestyle and budget. All plans include our core protection services with varying coverage levels and benefits.</p>
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

          <div className="text-center mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <Shield className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">Comprehensive Coverage</h3>
                <p className="text-slate-600">All plans include essential protection services with varying coverage levels and benefits.</p>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">Family Focused</h3>
                <p className="text-slate-600">Protect your entire family with coverage that includes spouse and children benefits.</p>
              </div>
              <div className="text-center">
                <Heart className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Activation</h3>
                <p className="text-slate-600">Your protection starts immediately after payment, with no waiting periods or delays.</p>
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
