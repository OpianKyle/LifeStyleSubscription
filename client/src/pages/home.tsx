import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PlanCard from "@/components/pricing/plan-card";
import Chatbot from "@/components/chat/chatbot";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Shield, Heart, Phone, Scale, Users, Check, Loader2 } from "lucide-react";

// Import generated images
import heroImage from "@assets/generated_images/Family_protection_hero_image_fda77672.png";
import medicalImage from "@assets/generated_images/Medical_assistance_services_scene_2e9b279b.png";
import legalImage from "@assets/generated_images/Legal_support_consultation_scene_9e008e89.png";
import familyImage from "@assets/generated_images/Family_protection_concept_image_723c8e84.png";
import financialImage from "@assets/generated_images/Financial_planning_consultation_scene_acac4653.png";
import emergencyBannerImage from "@assets/generated_images/Emergency_response_team_action_665c58d4.png";
import familyBannerImage from "@assets/generated_images/Family_celebration_portrait_e106c10d.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthState();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState('financial');

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

  const services = {
    medical: {
      title: "Medical Care",
      subtitle: "24/7 emergency medical assistance and professional healthcare support",
      image: medicalImage,
      features: ["Rapid emergency response", "Professional medical teams", "24/7 availability", "Ambulance services"]
    },
    legal: {
      title: "Legal Support", 
      subtitle: "Expert legal consultation and professional guidance for complex matters",
      image: legalImage,
      features: ["Professional consultations", "Expert legal guidance", "Complex matter support", "Document assistance"]
    },
    family: {
      title: "Family Protection",
      subtitle: "Comprehensive coverage for your loved ones with complete peace of mind",
      image: familyImage,
      features: ["Funeral assistance coverage", "Family income benefits", "Complete support services", "Emergency assistance"]
    },
    financial: {
      title: "Financial Planning",
      subtitle: "Smart financial guidance to build wealth and secure your future",
      image: financialImage,
      features: ["Investment guidance", "Budget planning", "Wealth building strategies", "Retirement planning"]
    }
  };

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
        <div className="absolute inset-0 left-1/2 w-1/2 z-0 md:block hidden">
          <img 
            src={heroImage} 
            alt="South African family protected by Opian Lifestyle" 
            className="w-full h-full object-cover"
          />
          {/* Image overlay with slanted edge */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-slate-900/60"></div>
        </div>
        
        {/* Slanted Overlay Section */}
        <div className="absolute right-1/3 top-0 h-full w-2/3 z-10 md:block hidden">
          <div 
            className="h-full w-full bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95"
            style={{
              clipPath: 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)'
            }}
          ></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left side - Content */}
            <div className="max-w-2xl mx-auto md:mx-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-left" style={{animationDelay: '0.2s'}}>
                The Protection Program that works for you
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed animate-fade-in-left" style={{animationDelay: '0.4s'}}>
                Make your money go further with our lifestyle protection plans. Our comprehensive program protects you when you do everyday activities, plus we provide expert guidance on financial planning to help you make smart decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-left" style={{animationDelay: '0.6s'}}>
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  onClick={scrollToPricing}
                >
                  More Information
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                <Button 
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  onClick={() => setLocation('/dashboard')}
                >
                  Get Started Today
                </Button>
              </div>
            </div>
            
            {/* Right side - spacer for image */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
        
        {/* Mobile Background */}
        <div className="md:hidden absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="South African family protected by Opian Lifestyle" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80"></div>
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

      {/* Banner Section 1 - Emergency Response */}
      <section 
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: `url(${emergencyBannerImage})`
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            When Every Second Counts
          </h2>
          <p className="text-2xl text-white/90 mb-8">
            Our emergency response team is ready 24/7 to provide immediate assistance when you need it most.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div>
              <div className="text-4xl font-bold mb-2">5 min</div>
              <div className="text-white/80">Average Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Available Every Day</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-white/80">Coverage Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Section 2 - Legal Support (Image Right) */}
      <section className="w-full bg-gradient-to-br from-white to-slate-50">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          {/* Content Left */}
          <div className="flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-secondary/5 to-secondary/15">
            <div className="max-w-xl">
              <div className="inline-flex items-center bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Scale className="w-4 h-4 mr-2" />
                Legal Excellence
              </div>
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
            <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Legal Protection</h4>
                  <p className="text-sm text-slate-600">Expert guidance available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Section 2 - Family Values */}
      <section 
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: `url(${familyBannerImage})`
        }}
      >
        <div className="absolute inset-0 bg-black/75"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Your Family is Our Priority
              </h2>
              <p className="text-2xl text-white/90 mb-8">
                We understand that family comes first. That's why our protection plans are designed to keep your loved ones safe and secure.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-4 text-lg"
                onClick={() => setLocation('/dashboard')}
              >
                Protect Your Family Today
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6 text-white">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Heart className="w-12 h-12 text-white mb-4" />
                <h3 className="text-xl font-bold mb-2">Family Care</h3>
                <p className="text-white/80">Comprehensive coverage for every family member</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Shield className="w-12 h-12 text-white mb-4" />
                <h3 className="text-xl font-bold mb-2">Protection</h3>
                <p className="text-white/80">Complete security and peace of mind</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Section 3 - Financial Planning (Image Right) */}
      <section className="w-full bg-gradient-to-br from-slate-50 to-white">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          {/* Content Left */}
          <div className="flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-primary/5 to-primary/15">
            <div className="max-w-xl">
              <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Users className="w-4 h-4 mr-2" />
                Financial Growth
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Smart Financial Planning
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Expert financial guidance to help you build wealth while staying protected. Our advisors provide personalized strategies for your financial future.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Investment guidance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Budget planning strategies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-700">Wealth building support</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Image Right */}
          <div className="relative">
            <img 
              src={financialImage} 
              alt="Financial planning consultation" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/10 to-primary/30"></div>
            <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Financial Growth</h4>
                  <p className="text-sm text-slate-600">Expert advice available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curved Heading Section */}
      <section className="min-h-screen bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Side - Curved Headings */}
          <div className="flex items-center justify-center relative px-4 sm:px-6 md:px-8 lg:px-16 py-8 lg:py-0">
            <div className="space-y-8 sm:space-y-10 md:space-y-12 relative z-10 w-full">
              {/* Curved path for headings */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h2 
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold cursor-pointer hover:scale-110 transition-all duration-500 hover:rotate-1 ${
                    selectedService === 'medical' ? 'text-primary scale-115 animate-pulse-slow' : 'text-slate-400 hover:text-primary'
                  }`}
                  style={{ transform: 'translateX(0px) translateY(0px)' }}
                  onClick={() => setSelectedService('medical')}
                >
                  Medical Care
                </h2>
              </div>
              
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold cursor-pointer hover:scale-110 transition-all duration-500 hover:-rotate-1 ${
                    selectedService === 'legal' ? 'text-secondary scale-115 animate-pulse-slow' : 'text-slate-400 hover:text-secondary'
                  }`}
                  style={{ transform: 'translateX(20px) translateY(10px)' }}
                  onClick={() => setSelectedService('legal')}
                >
                  Legal Support
                </h2>
              </div>
              
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h2 
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold cursor-pointer hover:scale-110 transition-all duration-500 hover:rotate-1 ${
                    selectedService === 'family' ? 'text-primary scale-115 animate-pulse-slow' : 'text-slate-400 hover:text-primary'
                  }`}
                  style={{ transform: 'translateX(40px) translateY(20px)' }}
                  onClick={() => setSelectedService('family')}
                >
                  Family Protection
                </h2>
              </div>
              
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <h2 
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold cursor-pointer hover:scale-110 transition-all duration-500 hover:-rotate-1 ${
                    selectedService === 'financial' ? 'text-secondary scale-115 animate-pulse-slow' : 'text-slate-400 hover:text-secondary'
                  }`}
                  style={{ transform: 'translateX(60px) translateY(30px)' }}
                  onClick={() => setSelectedService('financial')}
                >
                  Financial Planning
                </h2>
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
            <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 h-96 lg:h-full">
              <div className="relative w-full max-w-2xl">
                {/* Dynamic Image based on selected service */}
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
                  <img 
                    src={services[selectedService as keyof typeof services].image} 
                    alt={services[selectedService as keyof typeof services].title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Dynamic content card - positioned to not overlap */}
                <div className="mt-6 lg:absolute lg:-bottom-8 lg:left-0 lg:right-0 bg-white rounded-xl p-4 lg:p-6 shadow-lg border border-primary/20 lg:mx-4">
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3">
                    {services[selectedService as keyof typeof services].title}
                  </h3>
                  <p className="text-slate-600 mb-4 text-sm lg:text-base">
                    {services[selectedService as keyof typeof services].subtitle}
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {services[selectedService as keyof typeof services].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Floating indicator cards - adjusted positioning */}
                <div className="hidden lg:block absolute -top-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-primary/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs">24/7 Support</h4>
                      <p className="text-xs text-slate-600">Always available</p>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:block absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-secondary/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs">Protected</h4>
                      <p className="text-xs text-slate-600">Complete coverage</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

        </div>
      </section>



      <Footer />
      <Chatbot />
    </div>
  );
}
