import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";
import { apiRequest } from "@/lib/queryClient";
import { getMemoryAccessToken } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { 
  Download, 
  CreditCard, 
  MessageCircle, 
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle,
  Home,
  Settings,
  FileText,
  Shield,
  LogOut,
  Menu,
  Check,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Activity
} from "lucide-react";
import PlanCard from "@/components/pricing/plan-card";
import opianLogo from "@assets/opian-rewards-logo-Recovered_1755772691086.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ExtendedCoverSection from "@/components/dashboard/extended-cover-section";
import Chatbot from "@/components/chat/chatbot";

function DashboardContent() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthState();
  const { hasActiveSubscription } = useSubscriptionState();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(hasActiveSubscription ? 'overview' : 'pricing');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Handle payment success redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const ref = urlParams.get('ref');
    
    if (paymentStatus === 'success' && ref) {
      // Clear URL parameters
      window.history.replaceState({}, '', '/dashboard');
      
      // Show success message and refresh subscription data
      toast({
        title: "Payment Successful! 🎉",
        description: "Your subscription has been activated. Welcome to Opian Lifestyle!",
      });
      
      // Refresh subscription data
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Set active section to overview for new subscribers
      setActiveSection('overview');
    }
  }, [toast, queryClient]);

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

  // Redirect users without subscription to pricing section
  useEffect(() => {
    if (!hasActiveSubscription && activeSection !== 'pricing') {
      setActiveSection('pricing');
    }
  }, [hasActiveSubscription, activeSection]);

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscriptions/current"],
    enabled: isAuthenticated && user,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated && user,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated && user,
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/plans"],
    enabled: isAuthenticated && user,
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

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planName: string) => {
      const response = await apiRequest("POST", "/api/subscriptions/create", { planName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      toast({
        title: "Subscription Created",
        description: "Your subscription has been created successfully.",
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
        description: "Failed to create subscription. Please try again.",
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const subscription = (subscriptionData as any)?.subscription;
  const invoices = (invoicesData as any)?.invoices || [];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    queryClient.clear();
    setLocation('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to select a plan.",
        variant: "destructive",
      });
      return;
    }

    // Find the plan by name and redirect to subscription form
    const plan = (plansData as any)?.plans?.find((p: any) => p.name === planName);
    if (plan) {
      setLocation(`/subscription-form/${plan.id}`);
    } else {
      toast({
        title: "Error",
        description: "Plan not found. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sidebarItems = [
    {
      title: "Overview",
      icon: Home,
      id: "overview",
      onClick: () => setActiveSection('overview'),
      requiresSubscription: true
    },
    {
      title: "Subscription",
      icon: Shield,
      id: "subscription", 
      onClick: () => setActiveSection('subscription'),
      requiresSubscription: true
    },
    {
      title: "Extended Cover",
      icon: UserPlus,
      id: "extended-cover",
      onClick: () => setActiveSection('extended-cover'),
      requiresSubscription: true
    },
    {
      title: "Invoices",
      icon: FileText,
      id: "invoices",
      onClick: () => setActiveSection('invoices'),
      requiresSubscription: true
    },
    {
      title: "Transaction History",
      icon: Activity,
      id: "transactions",
      onClick: () => setActiveSection('transactions'),
      requiresSubscription: true
    },
    {
      title: "Plans & Pricing",
      icon: CreditCard,
      id: "pricing",
      onClick: () => setActiveSection('pricing'),
      requiresSubscription: false
    },
    {
      title: "Settings",
      icon: Settings,
      id: "settings",
      onClick: () => setActiveSection('settings'),
      requiresSubscription: true
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-4">
            {/* Opian Logo */}
            <div className="flex items-center justify-center mb-4">
              <img 
                src={opianLogo} 
                alt="Opian Lifestyle" 
                className="h-12 w-auto"
                data-testid="dashboard-logo"
              />
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900 truncate">{user.name}</h2>
                <p className="text-sm text-slate-600 truncate">{user.email}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => {
                    const isLocked = item.requiresSubscription && !hasActiveSubscription;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                          onClick={isLocked ? () => {
                            toast({
                              title: "Subscription Required",
                              description: "Please select a plan to access this feature.",
                              variant: "destructive",
                            });
                          } : item.onClick}
                          isActive={activeSection === item.id}
                          className={`w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                          {isLocked && <span className="ml-auto text-xs">🔒</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveSection('pricing')}>
                      <CreditCard className="w-4 h-4" />
                      <span>Change Plan</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <MessageCircle className="w-4 h-4" />
                      <span>Support</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="text-red-600 hover:text-red-700">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    {activeSection === 'overview' && 'Dashboard Overview'}
                    {activeSection === 'subscription' && 'My Subscription'}
                    {activeSection === 'extended-cover' && 'Extended Cover'}
                    {activeSection === 'invoices' && 'Billing & Invoices'}
                    {activeSection === 'transactions' && 'Transaction History'}
                    {activeSection === 'pricing' && 'Plans & Pricing'}
                    {activeSection === 'settings' && 'Account Settings'}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {activeSection === 'overview' && 'Welcome to your protection dashboard'}
                    {activeSection === 'subscription' && 'Manage your current plan and benefits'}
                    {activeSection === 'extended-cover' && 'Add family members and additional coverage'}
                    {activeSection === 'invoices' && 'View and download your billing history'}
                    {activeSection === 'transactions' && 'Track your payment transactions'}
                    {activeSection === 'pricing' && 'Explore and upgrade your protection plan'}
                    {activeSection === 'settings' && 'Update your account information and preferences'}
                  </p>
                </div>
                {subscription?.status === 'ACTIVE' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Protected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 text-amber-800">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {subscription?.status || 'Not Protected'}
                  </Badge>
                )}
              </div>
              
              {/* Right side header actions */}
              <div className="flex items-center space-x-3">
                {hasActiveSubscription && (
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Get Help
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {activeSection === 'overview' && (
              <div className="space-y-8">
                {/* Welcome Section - Light Stained Glass Effect */}
                <div className="relative overflow-hidden rounded-2xl p-8">
                  {/* Stained Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200/90 via-purple-100/70 to-pink-200/85"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-emerald-200/60 via-transparent to-amber-200/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/60 via-transparent to-rose-100/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-100/40 via-transparent to-indigo-100/45"></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Welcome back, {user.name}!</h2>
                        <p className="text-slate-600 text-lg">
                          {subscription ? 
                            `Your ${subscription.plan.name} plan is keeping you protected` : 
                            'Ready to start your protection journey?'
                          }
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/50 to-blue-100/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-lg">
                          <Shield className="w-10 h-10 text-brand-600" />
                        </div>
                      </div>
                    </div>
                    
                    {subscription && (
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-gradient-to-br from-white/40 to-blue-50/60 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm">
                          <div className="text-2xl font-bold text-slate-800">R{subscription.plan.price}</div>
                          <div className="text-sm text-slate-600">Monthly Cost</div>
                        </div>
                        <div className="bg-gradient-to-br from-white/40 to-emerald-50/60 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm">
                          <div className="text-2xl font-bold text-slate-800">{subscription.plan.features?.length || 0}</div>
                          <div className="text-sm text-slate-600">Benefits</div>
                        </div>
                        <div className="bg-gradient-to-br from-white/40 to-purple-50/60 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm">
                          <div className="text-2xl font-bold text-slate-800">
                            {subscription?.currentPeriodEnd 
                              ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                              : '--'}
                          </div>
                          <div className="text-sm text-slate-600">Next Billing</div>
                        </div>
                        <div className="bg-gradient-to-br from-white/40 to-emerald-50/70 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm">
                          <div className="text-2xl font-bold text-emerald-700">
                            {subscription.status === 'ACTIVE' ? 'ACTIVE' : subscription.status}
                          </div>
                          <div className="text-sm text-slate-600">Status</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-brand-200 cursor-pointer" 
                        onClick={() => setActiveSection('pricing')} data-testid="card-change-plan">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {subscription ? 'Change Plan' : 'Choose Plan'}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        {subscription ? 'Upgrade or modify your current plan' : 'Select the perfect protection plan for you'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-emerald-200 cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Get Support</h3>
                      <p className="text-slate-600 text-sm">
                        Need help? Our support team is here for you 24/7
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 cursor-pointer"
                        onClick={() => setActiveSection('invoices')}>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Download Invoice</h3>
                      <p className="text-slate-600 text-sm">
                        Access and download your billing history
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Plan Details */}
                {subscription ? (
                  <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-emerald-900">Your {subscription.plan.name} Plan</CardTitle>
                            <p className="text-emerald-700">Active and protecting you</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {subscription.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-emerald-900 mb-3">Your Benefits</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {Array.isArray(subscription.plan.features) 
                              ? subscription.plan.features.map((feature: string, index: number) => (
                                  <div key={index} className="flex items-start space-x-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-emerald-800">{feature}</span>
                                  </div>
                                ))
                              : typeof subscription.plan.features === 'string' 
                                ? JSON.parse(subscription.plan.features).map((feature: string, index: number) => (
                                    <div key={index} className="flex items-start space-x-3">
                                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-emerald-800">{feature}</span>
                                    </div>
                                  ))
                                : null
                            }
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-white/50 rounded-lg p-4">
                            <div className="text-sm text-emerald-700 mb-1">Monthly Investment</div>
                            <div className="text-2xl font-bold text-emerald-900">R{subscription.plan.price}</div>
                          </div>
                          
                          <div className="bg-white/50 rounded-lg p-4">
                            <div className="text-sm text-emerald-700 mb-1">Next Billing Date</div>
                            <div className="text-lg font-semibold text-emerald-900">
                              {subscription?.currentPeriodEnd 
                                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-ZA', { 
                                    weekday: 'long',
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'Not set'}
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <Button 
                              onClick={() => setActiveSection('pricing')} 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              data-testid="button-upgrade-plan"
                            >
                              Upgrade Plan
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setActiveSection('subscription')}
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-brand-300 bg-gradient-to-br from-brand-50 to-indigo-50">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4">Start Your Protection Journey</h3>
                      <p className="text-slate-600 mb-8 max-w-md mx-auto">
                        Choose from our comprehensive protection plans designed specifically for South African families.
                      </p>
                      <Button 
                        onClick={() => setActiveSection('pricing')} 
                        size="lg"
                        className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700"
                        data-testid="button-browse-plans"
                      >
                        Browse Protection Plans
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === 'subscription' && (
              <div className="space-y-8">
                {/* Subscription Welcome Section */}
                <div className="relative overflow-hidden rounded-2xl p-8">
                  {/* Stained Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/90 via-green-100/70 to-teal-200/85"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-blue-200/60 via-transparent to-cyan-200/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-mint-100/60 via-transparent to-emerald-100/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-100/40 via-transparent to-blue-100/45"></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Your Protection Plan</h2>
                        <p className="text-slate-600 text-lg">
                          {subscription ? 
                            `Manage your ${subscription.plan.name} subscription` : 
                            'No active subscription - start your protection today'
                          }
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/50 to-emerald-100/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-lg">
                          <Shield className="w-10 h-10 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                  <CardHeader>
                    <CardTitle className="text-emerald-900">Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-emerald-900">{subscription.plan.name}</h3>
                            <p className="text-emerald-700 text-lg">R{subscription.plan.price}/month</p>
                          </div>
                          <Badge className={subscription.status === 'ACTIVE' ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 'bg-slate-400 text-white'}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {subscription.status}
                          </Badge>
                        </div>
                        
                        <div className="bg-white/50 rounded-lg p-4">
                          <h4 className="font-semibold text-emerald-900 mb-3">Your Benefits</h4>
                          <div className="grid md:grid-cols-2 gap-2">
                            {subscription.plan.features?.map((feature: string, index: number) => (
                              <div key={index} className="flex items-start space-x-3">
                                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-emerald-800">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => setActiveSection('pricing')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            Change Plan
                          </Button>
                          {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
                            <Button 
                              variant="destructive" 
                              onClick={() => cancelSubscriptionMutation.mutate()}
                              disabled={cancelSubscriptionMutation.isPending}
                            >
                              {cancelSubscriptionMutation.isPending ? 'Canceling...' : 'Cancel'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">No Active Subscription</h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">Start protecting your lifestyle today with one of our comprehensive plans</p>
                        <Button 
                          onClick={() => setActiveSection('pricing')}
                          size="lg"
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                        >
                          Choose a Plan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'invoices' && (
              <div className="space-y-8">
                {/* Invoices Welcome Section */}
                <div className="relative overflow-hidden rounded-2xl p-8">
                  {/* Stained Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-200/90 via-indigo-100/70 to-blue-200/85"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-violet-200/60 via-transparent to-purple-200/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-transparent to-indigo-100/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/40 via-transparent to-violet-100/45"></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Billing & Invoices</h2>
                        <p className="text-slate-600 text-lg">
                          {invoices.length > 0 ? 
                            `You have ${invoices.length} invoice${invoices.length > 1 ? 's' : ''} on record` : 
                            'No invoices available yet'
                          }
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/50 to-purple-100/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-lg">
                          <FileText className="w-10 h-10 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-purple-900">Invoice History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invoicesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                      </div>
                    ) : invoices.length > 0 ? (
                      <div className="space-y-4">
                        {invoices.map((invoice: any) => (
                          <div key={invoice.id} className="bg-white/50 rounded-lg p-4 border border-white/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-purple-900 text-lg">R{parseFloat(invoice.amount).toFixed(2)}</p>
                                <p className="text-sm text-purple-700">
                                  {new Date(invoice.createdAt).toLocaleDateString('en-ZA', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge className={invoice.status === 'paid' ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 'bg-slate-400 text-white'}>
                                  {invoice.status}
                                </Badge>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                  onClick={async () => {
                                    try {
                                      const headers: Record<string, string> = {};
                                      const token = getMemoryAccessToken();
                                      if (token) {
                                        headers.Authorization = `Bearer ${token}`;
                                      }
                                      
                                      const response = await fetch(`/api/invoices/${invoice.id}/download`, {
                                        credentials: 'include',
                                        headers
                                      });
                                      
                                      if (response.ok) {
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = url;
                                        a.download = `invoice-${invoice.id}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                        
                                        toast({
                                          title: "Download Complete",
                                          description: "Invoice has been downloaded successfully.",
                                        });
                                      } else {
                                        throw new Error('Failed to download invoice');
                                      }
                                    } catch (error) {
                                      console.error('Error downloading invoice:', error);
                                      toast({
                                        title: "Download Failed",
                                        description: "There was an error downloading the invoice. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  data-testid={`button-download-invoice-${invoice.id}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">No Invoices Yet</h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">Your billing history will appear here once you start your subscription</p>
                        <Button 
                          onClick={() => setActiveSection('pricing')}
                          size="lg"
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                        >
                          Start Subscription
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'transactions' && (
              <div className="space-y-8">
                {/* Transaction History Welcome Section */}
                <div className="relative overflow-hidden rounded-2xl p-8">
                  {/* Stained Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-200/90 via-cyan-100/70 to-blue-200/85"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-emerald-200/60 via-transparent to-teal-200/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/60 via-transparent to-indigo-100/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-teal-100/40 via-transparent to-cyan-100/45"></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Transaction History</h2>
                        <p className="text-slate-600 text-lg">
                          {(transactionsData as any)?.transactions?.length > 0 ? 
                            `${(transactionsData as any)?.transactions?.length} payment transaction${(transactionsData as any)?.transactions?.length > 1 ? 's' : ''} recorded` : 
                            'No payment transactions yet'
                          }
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/50 to-teal-100/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-lg">
                          <Activity className="w-10 h-10 text-teal-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-teal-900">Payment Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
                      </div>
                    ) : (transactionsData as any)?.transactions?.length > 0 ? (
                      <div className="space-y-4">
                        {(transactionsData as any)?.transactions?.map((transaction: any) => (
                          <div key={transaction.id} className="bg-white/50 rounded-lg p-4 border border-white/30">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <p className="font-semibold text-teal-900 text-lg">R{parseFloat(transaction.amount).toFixed(2)}</p>
                                  <Badge className={transaction.adumoStatus === 'SUCCESS' ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 
                                                   transaction.adumoStatus === 'PENDING' ? 'bg-amber-500 hover:bg-amber-500 text-white' :
                                                   'bg-red-500 hover:bg-red-500 text-white'}>
                                    {transaction.adumoStatus}
                                  </Badge>
                                  <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded">
                                    {transaction.gateway}
                                  </span>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4 text-sm text-teal-700">
                                  <div>
                                    <span className="font-medium">Date:</span> {new Date(transaction.createdAt).toLocaleDateString('en-ZA', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div>
                                    <span className="font-medium">Reference:</span> {transaction.merchantReference}
                                  </div>
                                  <div>
                                    <span className="font-medium">Payment Method:</span> {transaction.paymentMethod || 'Card'}
                                  </div>
                                </div>
                                {transaction.adumoTransactionId && (
                                  <div className="mt-2 text-xs text-teal-600">
                                    Transaction ID: {transaction.adumoTransactionId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Activity className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">No Transactions Yet</h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">Your payment transactions will appear here once you start making payments</p>
                        <Button 
                          onClick={() => setActiveSection('pricing')}
                          size="lg"
                          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                        >
                          Start Subscription
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-8">
                {/* Settings Welcome Section */}
                <div className="relative overflow-hidden rounded-2xl p-8">
                  {/* Stained Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200/90 via-orange-100/70 to-red-200/85"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-yellow-200/60 via-transparent to-amber-200/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-100/60 via-transparent to-red-100/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/40 via-transparent to-orange-100/45"></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Account Settings</h2>
                        <p className="text-slate-600 text-lg">
                          Manage your profile, payment methods, and preferences
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/50 to-amber-100/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-lg">
                          <Settings className="w-10 h-10 text-amber-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Profile Information */}
                  <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader>
                      <CardTitle className="text-amber-900">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white/50 rounded-lg p-4">
                        <label className="text-sm font-semibold text-amber-900">Name</label>
                        <p className="text-amber-800 text-lg">{user.name}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4">
                        <label className="text-sm font-semibold text-amber-900">Email</label>
                        <p className="text-amber-800 text-lg">{user.email}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4">
                        <label className="text-sm font-semibold text-amber-900">Role</label>
                        <p className="text-amber-800 text-lg">{user.role}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader>
                      <CardTitle className="text-amber-900">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update Payment Method
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Separator />
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700" 
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Settings */}
                <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="text-amber-900">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-amber-900 mb-1">Notifications</h4>
                        <p className="text-sm text-amber-700">Email alerts enabled</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <Shield className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-amber-900 mb-1">Security</h4>
                        <p className="text-sm text-amber-700">Account protected</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <Calendar className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-amber-900 mb-1">Billing</h4>
                        <p className="text-sm text-amber-700">Monthly cycle</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'pricing' && (
              <div className="space-y-8">
                {/* Pricing Welcome Section */}
                <div className="relative overflow-hidden rounded-2xl p-8">
                  {/* Stained Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/90 via-blue-100/70 to-indigo-200/85"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-purple-200/60 via-transparent to-cyan-200/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-transparent to-purple-100/55"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/40 via-transparent to-blue-100/45"></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/15 border border-white/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <h2 className="text-2xl font-bold mb-2 text-slate-800">Choose Your Protection Plan</h2>
                    <p className="text-slate-600 text-lg mb-6">
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
                {subscription && (
                  <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader>
                      <CardTitle className="text-emerald-900 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Current Subscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-emerald-800 text-lg">
                          You currently have the <strong className="text-emerald-900">{subscription.plan.name}</strong> plan.
                          You can upgrade or change your plan below.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Plans Carousel */}
                {plansLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="px-12">
                    <Carousel className="w-full">
                      <CarouselContent className="-ml-4">
                        {((plansData as any)?.plans || []).map((plan: any) => (
                          <CarouselItem key={plan.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
                            <PlanCard
                              plan={plan}
                              onSelect={handleSelectPlan}
                              loading={updateSubscriptionMutation.isPending && selectedPlan === plan.name}
                              isCurrentPlan={subscription?.plan.name === plan.name}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0" />
                      <CarouselNext className="right-0" />
                    </Carousel>
                  </div>
                )}

                {/* Help Section */}
                <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-cyan-900">Need Help Choosing?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/50 rounded-lg p-4">
                      <p className="text-cyan-800 mb-4">
                        Not sure which plan is right for you? Here's a quick guide:
                      </p>
                      <ul className="space-y-3 text-cyan-700">
                        <li className="flex items-start">
                          <Badge className="bg-cyan-100 text-cyan-800 mr-3 mt-0.5">OPPORTUNITY</Badge>
                          <span>Perfect for individuals needing basic protection</span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="bg-cyan-100 text-cyan-800 mr-3 mt-0.5">MOMENTUM</Badge>
                          <span>Great for growing families with increased coverage</span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="bg-cyan-100 text-cyan-800 mr-3 mt-0.5">PROSPER</Badge>
                          <span>Comprehensive protection for established families</span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="bg-cyan-100 text-cyan-800 mr-3 mt-0.5">PRESTIGE</Badge>
                          <span>Premium coverage with superior benefits</span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="bg-cyan-100 text-cyan-800 mr-3 mt-0.5">PINNACLE</Badge>
                          <span>Ultimate protection with maximum coverage</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'extended-cover' && (
              <ExtendedCoverSection />
            )}
          </main>
        </SidebarInset>
      </div>
      <Chatbot />
    </SidebarProvider>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
