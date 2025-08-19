import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PlanCard from "@/components/pricing/plan-card";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Shield, Heart, Phone, Scale, Users, Check, Loader2 } from "lucide-react";

// Import generated images
import heroImage from "@assets/generated_images/Family_protection_hero_image_fda77672.png";
import medicalImage from "@assets/generated_images/Medical_assistance_services_illustration_d0d96e6e.png";
import legalImage from "@assets/generated_images/Legal_support_services_illustration_4e8f75c7.png";
import familyImage from "@assets/generated_images/Family_protection_benefits_illustration_1824d9d7.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthState();
  const { toast } = useToast();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["/api/plans"],
  });



  const handleSelectPlan = async (planName: string) => {
    if (!isAuthenticated) {
      setLocation('/auth?redirect=/choose-plan');
      toast({
        title: "Authentication Required",
        description: "Please sign in to select a plan.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to choose plan page for authenticated users
    setLocation('/choose-plan');
  };

  const plans = (plansData as any)?.plans || [];

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
      
      {/* Hero Section - Opian Style */}
      <section className="relative overflow-hidden pt-20 pb-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                The Protection Program that works for you
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Make your money go further with our lifestyle protection plans. Our comprehensive program protects you when you do everyday activities, plus we provide expert guidance on financial planning to help you make smart decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg"
                  onClick={scrollToPricing}
                >
                  More Information
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-slate-900 font-semibold px-8 py-4 text-lg"
                  onClick={() => setLocation('/auth')}
                >
                  Get Started Today
                </Button>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-96 h-72 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={heroImage} 
                    alt="South African family protected by Opian Lifestyle" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="text-xl font-bold mb-2">Your Family's Protection</h3>
                    <p className="text-sm opacity-90">Comprehensive lifestyle protection for South African families</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Stats */}
          <div className="grid sm:grid-cols-3 gap-8 mt-16 text-center text-white">
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-slate-300">Emergency Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">R350+</div>
              <div className="text-slate-300">Plans from</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-slate-300">Family Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What If Your Protection Plan Paid You Back?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our innovative approach combines traditional protection with smart financial benefits, helping you build wealth while staying protected.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={medicalImage} 
                    alt="Medical assistance services" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">Protection on Everything</h3>
                <p className="text-slate-600">Emergency services, legal support, family benefits—comprehensive coverage for your everyday life.</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={legalImage} 
                    alt="Legal support services" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">Build Your Own Protection Stack</h3>
                <p className="text-slate-600">Combine our protection system with your current benefits to create comprehensive family coverage!</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={familyImage} 
                    alt="Family protection benefits" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">Make Your Money Work for You</h3>
                <p className="text-slate-600">With expert financial guidance, make smarter planning decisions to save and build wealth for your family.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple Steps. Serious Protection.
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Getting started is simple and empowering. Every step is designed to help you gain protection and unlock greater benefits—just by doing what you already do.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-3">Personalized Support</h3>
              <p className="text-slate-600">Submit your details and one of our friendly agents will reach out to guide you through the sign-up process.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-3">Get Protected Instantly</h3>
              <p className="text-slate-600">Choose your plan and get immediate access to emergency services, legal support, and family benefits.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-3">Stack Your Benefits</h3>
              <p className="text-slate-600">Combine different protection channels and watch your coverage multiply. The more comprehensive, the better protected.</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold mb-3">Live Protected</h3>
              <p className="text-slate-600">Start your protection journey now and transform how you plan, protect, and prosper. Join thousands already protected.</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg"
              onClick={() => setLocation('/auth')}
            >
              More Information
            </Button>
          </div>
        </div>
      </section>

      {/* Additional Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Get Protected Effortlessly
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Our protection plans are designed to make your life more secure and rewarding, covering you in all aspects of daily life.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Protect Your Way</h3>
                    <p className="text-slate-600">Use your protection plan for everyday emergencies—from medical assistance to legal support—and have peace of mind!</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Cover Your Family</h3>
                    <p className="text-slate-600">Comprehensive family protection including funeral cover, income benefits, and emergency support for all your loved ones.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Plan for Success</h3>
                    <p className="text-slate-600">Engage in smart financial planning and decision-making—whether it's budgeting, saving, or investing. We reward your financial wisdom!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="h-full flex flex-col justify-center items-center text-center">
                  <Shield className="w-24 h-24 mb-6 opacity-80" />
                  <h3 className="text-2xl font-bold mb-4">Personalized Support at Your Fingertips</h3>
                  <p className="text-blue-100">Ready to make the most out of your protection plan? Complete our quick contact form, and an agent will reach out to explain all the incredible benefits you can unlock.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-lg text-slate-300">Emergency Support</div>
            </div>
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">5</div>
              <div className="text-lg text-slate-300">Protection Plans</div>
            </div>
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">R350</div>
              <div className="text-lg text-slate-300">Starting From</div>
            </div>
            <div className="py-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-lg text-slate-300">Coverage Guarantee</div>
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

      {/* Pricing Section - Opian Style */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Unlock More, Earn More, Be More.
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Choose the package that matches your ambitions. Each tier opens new possibilities for protection and benefits.
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
                />
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-20 text-center">
            <div className="bg-white rounded-3xl p-12 shadow-lg max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Join Protection Today!
              </h2>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                Don't miss out on comprehensive lifestyle protection! Join our community and start your journey towards a more secure lifestyle. Fill out the contact form now, and let us help you start getting protected from what life throws at you every day.
              </p>
              <p className="text-lg text-slate-700 font-medium mb-8">
                With our protection plans, every situation is an opportunity for peace of mind!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg"
                  onClick={() => setLocation('/auth')}
                >
                  Get Information
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-8 py-4 text-lg"
                  onClick={() => setLocation('/auth')}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-20">
            <div className="bg-white rounded-3xl p-12 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-blue-600" />
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



      <Footer />
    </div>
  );
}
