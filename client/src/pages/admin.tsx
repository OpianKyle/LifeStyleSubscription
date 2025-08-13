import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Download,
  Eye,
  Edit
} from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthState();
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user?.role, toast, setLocation]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  if (isLoading || usersLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const users = usersData?.users || [];
  const stats = statsData?.stats || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <section className="pricing-gradient pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600">Manage subscriptions and monitor system performance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Card className="feature-gradient rounded-2xl shadow-sm border border-slate-200/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brand-600 text-sm font-medium">Total Subscribers</p>
                    <p className="text-3xl font-bold text-brand-900" data-testid="stat-total-subscribers">
                      {stats.totalSubscribers || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-emerald-600 text-sm mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-sm border border-slate-200/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-emerald-900" data-testid="stat-monthly-revenue">
                      R{stats.totalRevenue ? (parseFloat(stats.totalRevenue) / 100).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-emerald-600 text-sm mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-sm border border-slate-200/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-600 text-sm font-medium">Active Plans</p>
                    <p className="text-3xl font-bold text-amber-900" data-testid="stat-active-plans">5</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-emerald-600 text-sm mt-2">All plans active</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-sm border border-slate-200/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Issues</p>
                    <p className="text-3xl font-bold text-red-900" data-testid="stat-issues">0</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-emerald-600 text-sm mt-2">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Subscribers */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm border border-slate-200/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  <span>Recent Subscribers</span>
                </CardTitle>
                <Button 
                  variant="outline"
                  className="bg-brand-500 text-white hover:bg-brand-600 border-brand-500"
                  data-testid="button-export-subscribers"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Subscriber</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Plan</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Status</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Joined</th>
                        <th className="text-left py-3 text-sm font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 10).map((subscriber: any) => (
                        <tr key={subscriber.id} className="border-b border-slate-100">
                          <td className="py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {subscriber.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900" data-testid={`text-subscriber-name-${subscriber.id}`}>
                                  {subscriber.name}
                                </div>
                                <div className="text-sm text-slate-500" data-testid={`text-subscriber-email-${subscriber.id}`}>
                                  {subscriber.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-sm text-slate-900" data-testid={`text-subscriber-plan-${subscriber.id}`}>
                            {subscriber.subscription?.plan?.name || 'No Plan'}
                          </td>
                          <td className="py-3">
                            <Badge className={
                              subscriber.subscription?.status === 'ACTIVE'
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                            }>
                              {subscriber.subscription?.status || 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm text-slate-500" data-testid={`text-subscriber-joined-${subscriber.id}`}>
                            {new Date(subscriber.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-brand-600 hover:text-brand-700"
                                data-testid={`button-view-subscriber-${subscriber.id}`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-slate-600 hover:text-slate-700"
                                data-testid={`button-edit-subscriber-${subscriber.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Subscribers Yet</h3>
                  <p className="text-slate-600">Subscriber data will appear here once users start signing up.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
