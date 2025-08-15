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
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{subscription?.status || 'None'}</div>
                      <p className="text-xs text-muted-foreground">Current protection level</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R{subscription?.plan?.price || '0'}</div>
                      <p className="text-xs text-muted-foreground">Per month</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {subscription?.currentPeriodEnd 
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : '--'}
                      </div>
                      <p className="text-xs text-muted-foreground">Upcoming payment</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Plan</CardTitle>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{subscription?.plan?.name || 'None'}</div>
                      <p className="text-xs text-muted-foreground">Protection plan</p>
                    </CardContent>
                  </Card>
                </div>
                
                {!subscription && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Get Started</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">Choose a protection plan to secure your lifestyle.</p>
                      <Button onClick={() => setLocation('/pricing')} className="w-full sm:w-auto">
                        Browse Plans
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
