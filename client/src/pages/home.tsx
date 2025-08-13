import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { ArrowRight, Shield, Heart, Phone, Scale, Users, Check } from "lucide-react";

export default function Home() {
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

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-20 pricing-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choose Your Protection Plan</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Select the perfect plan for your lifestyle and budget. All plans include our core protection services with varying coverage levels.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center md:items-stretch">
            {/* OPPORTUNITY Plan */}
            <Card className="pricing-card">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">OPPORTUNITY</h3>
                  <div className="text-3xl font-bold text-brand-600 mb-1">R350</div>
                  <div className="text-sm text-slate-500">per month</div>
                </div>
                
                <ul className="space-y-3 mb-8 text-sm">
                  {['EMS Assist', 'Legal Assist', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Funeral Cover'].map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/pricing">
                  <Button className="w-full btn-secondary" data-testid="button-choose-opportunity">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* PROSPER Plan - Featured */}
            <Card className="pricing-card-featured">
              <CardContent className="p-8">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
                
                <div className="text-center mb-6 mt-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">PROSPER</h3>
                  <div className="text-3xl font-bold text-brand-600 mb-1">R550</div>
                  <div className="text-sm text-slate-500">per month</div>
                </div>
                
                <ul className="space-y-3 mb-8 text-sm">
                  {['Funeral Cover: R10,000', 'Accidental Death: R20,000', 'Family Income: R5,000 x6', 'EMS + Legal Assist', 'Virtual GP Assistant'].map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/pricing">
                  <Button className="w-full btn-primary" data-testid="button-choose-prosper">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* PINNACLE Plan */}
            <Card className="pricing-card">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">PINNACLE</h3>
                  <div className="text-3xl font-bold text-brand-600 mb-1">R825</div>
                  <div className="text-sm text-slate-500">per month</div>
                </div>
                
                <ul className="space-y-3 mb-8 text-sm">
                  {['Funeral Cover: R20,000', 'Accidental Death: R100,000', 'Family Income: R5,000 x6', 'Complete Protection Suite', 'Premium Support'].map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/pricing">
                  <Button className="w-full btn-secondary" data-testid="button-choose-pinnacle">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button className="btn-primary px-8 py-4 text-lg" data-testid="button-view-all-plans">
                View All Plans
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
