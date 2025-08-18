import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { apiRequest } from "@/lib/queryClient";
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
  Menu
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthState();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');

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

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscriptions/current"],
    enabled: isAuthenticated,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated,
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

  const sidebarItems = [
    {
      title: "Overview",
      icon: Home,
      id: "overview",
      onClick: () => setActiveSection('overview')
    },
    {
      title: "Subscription",
      icon: Shield,
      id: "subscription", 
      onClick: () => setActiveSection('subscription')
    },
    {
      title: "Invoices",
      icon: FileText,
      id: "invoices",
      onClick: () => setActiveSection('invoices')
    },
    {
      title: "Settings",
      icon: Settings,
      id: "settings",
      onClick: () => setActiveSection('settings')
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-6">
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
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={item.onClick}
                        isActive={activeSection === item.id}
                        className="w-full"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setLocation('/pricing')}>
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
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-semibold text-slate-900">
                  {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                </h1>
                {subscription?.status === 'ACTIVE' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 text-amber-800">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {subscription?.status || 'No Subscription'}
                  </Badge>
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
                        onClick={() => setLocation('/pricing')} data-testid="card-change-plan">
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
                            {subscription.plan.features?.map((feature: string, index: number) => (
                              <div key={index} className="flex items-start space-x-3">
                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-emerald-800">{feature}</span>
                              </div>
                            ))}
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
                              onClick={() => setLocation('/pricing')} 
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
                        onClick={() => setLocation('/pricing')} 
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
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                            <p className="text-muted-foreground">R{subscription.plan.price}/month</p>
                          </div>
                          <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {subscription.status}
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2">
                          <h4 className="font-medium">Features</h4>
                          {subscription.plan.features?.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={() => setLocation('/pricing')}>
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
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                        <p className="text-muted-foreground mb-4">Start protecting your lifestyle today</p>
                        <Button onClick={() => setLocation('/pricing')}>Choose a Plan</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'invoices' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invoicesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : invoices.length > 0 ? (
                      <div className="space-y-4">
                        {invoices.map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <p className="font-medium">R{parseFloat(invoice.amount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(invoice.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Invoices</h3>
                        <p className="text-muted-foreground">Your billing history will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-muted-foreground">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update Payment Method
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
