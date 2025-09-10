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
import medicalImage from "@assets/generated_images/Medical_assistance_services_scene_2e9b279b.png";
import legalImage from "@assets/generated_images/Legal_support_consultation_scene_9e008e89.png";
import familyImage from "@assets/generated_images/Family_protection_concept_image_723c8e84.png";
import financialImage from "@assets/generated_images/Financial_planning_consultation_scene_acac4653.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthState();
  const { toast } = useToast();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["/api/plans"],
  });



  const handleSelectPlan = async (planName: string) => {
    if (!isAuthenticated) {
      setLocation('/auth?redirect=/dashboard');
      toast({
        title: "Authentication Required",
        description: "Please sign in to view plans and pricing.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to dashboard for authenticated users
    setLocation('/dashboard');
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
    if (!isAuthenticated) {
      setLocation('/auth?redirect=/dashboard');
      toast({
        title: "Authentication Required",
        description: "Please sign in to view plans and pricing.",
        variant: "destructive",
      });
      return;
    }
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Split Design with Slanted Overlap */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Right Side - Image */}
        <div className="absolute inset-0 left-1/2 w-1/2 z-0">
          <img 
            src={heroImage} 
            alt="South African family protected by Opian Lifestyle" 
            className="w-full h-full object-cover"
          />
          {/* Image overlay with slanted edge */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-slate-900/60"></div>
        </div>
        
        {/* Slanted Overlay Section */}
        <div className="absolute right-1/3 top-0 h-full w-2/3 z-10">
          <div 
            className="h-full w-full bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95"
            style={{
              clipPath: 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)'
            }}
          ></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left side - Content */}
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
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 text-lg"
                  onClick={scrollToPricing}
                >
                  More Information
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <Button 
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8 py-4 text-lg"
                  onClick={() => setLocation('/dashboard')}
                >
                  Get Started Today
                </Button>
              </div>
              
              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-8 text-center text-white">
                <div>
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-slate-300 text-sm">Emergency Support</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">R350+</div>
                  <div className="text-slate-300 text-sm">Plans from</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">100%</div>
                  <div className="text-slate-300 text-sm">Family Coverage</div>
                </div>
              </div>
            </div>
            
            {/* Right side - spacer for image */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="lg:hidden relative z-20 w-full">
          <div className="absolute inset-0 bg-slate-900/80"></div>
          <div className="relative px-4 sm:px-6 py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                The Protection Program that works for you
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Make your money go further with our lifestyle protection plans.
              </p>
              
              <div className="flex flex-col gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 text-lg"
                  onClick={scrollToPricing}
                >
                  More Information
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <Button 
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8 py-4 text-lg"
                  onClick={() => setLocation('/dashboard')}
                >
                  Get Started Today
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center text-white">
                <div>
                  <div className="text-2xl font-bold mb-1">24/7</div>
                  <div className="text-slate-300 text-xs">Emergency Support</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">R350+</div>
                  <div className="text-slate-300 text-xs">Plans from</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-slate-300 text-xs">Family Coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Section 1 - Medical Assistance (Image Left) */}
      <section className="w-full bg-white">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          {/* Image Left */}
          <div className="relative">
            <img 
              src={medicalImage} 
              alt="Medical assistance services" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-primary/30"></div>
          </div>
          
          {/* Content Right */}
          <div className="flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                24/7 Emergency Medical Services
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Professional medical assistance available around the clock. Our experienced teams provide rapid response emergency services when you need them most, ensuring your family's health and safety.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Rapid emergency response</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Professional medical teams</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">24/7 availability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Section 2 - Legal Support (Image Right) */}
      <section className="w-full bg-white">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          {/* Content Left */}
          <div className="flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Expert Legal Assistance
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Professional legal support and consultation services to help you navigate complex legal matters. Our expert lawyers provide guidance when you need it most.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Professional consultations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Expert legal guidance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Complex matter support</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Image Right */}
          <div className="relative">
            <img 
              src={legalImage} 
              alt="Legal support services" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-secondary/10 to-secondary/30"></div>
          </div>
        </div>
      </section>

      {/* Full-Width Section 3 - Family Protection (Image Left) */}
      <section className="w-full bg-white">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          {/* Image Left */}
          <div className="relative">
            <img 
              src={familyImage} 
              alt="Family protection benefits" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-primary/30"></div>
          </div>
          
          {/* Content Right */}
          <div className="flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Comprehensive Family Protection
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Complete family coverage including funeral assistance, income benefits, and comprehensive support services for all your loved ones.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Funeral assistance coverage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Family income benefits</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Complete support services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curved Heading Section */}
      <section className="min-h-screen bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-screen">
          {/* Left Side - Curved Headings */}
          <div className="flex items-center justify-center relative px-8 lg:px-16">
            <div className="space-y-12 relative z-10">
              {/* Curved path for headings */}
              <div className="relative">
                <h2 
                  className="text-4xl lg:text-6xl font-bold text-primary mb-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                  style={{ transform: 'translateX(0px) translateY(0px)' }}
                >
                  Medical Care
                </h2>
                <p className="text-lg text-slate-600 max-w-md">24/7 emergency medical assistance and professional healthcare support</p>
              </div>
              
              <div className="relative">
                <h2 
                  className="text-4xl lg:text-6xl font-bold text-secondary mb-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                  style={{ transform: 'translateX(50px) translateY(20px)' }}
                >
                  Legal Support
                </h2>
                <p className="text-lg text-slate-600 max-w-md ml-12">Expert legal consultation and professional guidance for complex matters</p>
              </div>
              
              <div className="relative">
                <h2 
                  className="text-4xl lg:text-6xl font-bold text-primary mb-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                  style={{ transform: 'translateX(100px) translateY(40px)' }}
                >
                  Family Protection
                </h2>
                <p className="text-lg text-slate-600 max-w-md ml-24">Comprehensive coverage for your loved ones with complete peace of mind</p>
              </div>
              
              <div className="relative">
                <h2 
                  className="text-4xl lg:text-6xl font-bold text-secondary mb-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                  style={{ transform: 'translateX(150px) translateY(60px)' }}
                >
                  Financial Planning
                </h2>
                <p className="text-lg text-slate-600 max-w-md ml-36">Smart financial guidance to build wealth and secure your future</p>
              </div>
            </div>
            
            {/* Curved line decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 600 800" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M100 150 Q300 200 350 350 Q400 500 450 650" 
                  stroke="url(#gradient)" 
                  strokeWidth="3" 
                  fill="none"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(210, 100%, 50%)" />
                    <stop offset="50%" stopColor="hsl(142, 76%, 36%)" />
                    <stop offset="100%" stopColor="hsl(210, 100%, 50%)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          {/* Right Side - Dynamic Image Display */}
          <div className="relative bg-gradient-to-bl from-primary/10 to-secondary/10">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="relative w-full max-w-2xl">
                {/* Default Image - Financial Planning */}
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={financialImage} 
                    alt="Financial planning consultation" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Floating cards with content */}
                <div className="absolute -top-8 -left-8 bg-white rounded-xl p-6 shadow-lg border border-primary/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">24/7 Support</h4>
                      <p className="text-sm text-slate-600">Always available</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-8 -right-8 bg-white rounded-xl p-6 shadow-lg border border-secondary/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Protected</h4>
                      <p className="text-sm text-slate-600">Complete coverage</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  onClick={() => setLocation('/dashboard')}
                >
                  View Plans
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-8 py-4 text-lg"
                  onClick={() => setLocation('/dashboard')}
                >
                  View Plans
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
