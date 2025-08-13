import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

type AuthMode = 'login' | 'register' | 'verify-email' | 'reset-password' | 'forgot-password';

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { 
    login, 
    register,
    isAuthenticated
  } = useAuthState();

  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      switch (mode) {
        case 'login':
          await login(formData.email, formData.password);
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          });
          setLocation('/dashboard');
          break;

        case 'register':
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
          }
          const result = await register(formData.email, formData.password, formData.name);
          setSuccess('Registration successful. Please check your email for verification.');
          setMode('login');
          toast({
            title: "Registration Successful",
            description: "Please check your email to verify your account.",
          });
          break;

        case 'forgot-password':
          setSuccess('This feature will be available soon.');
          toast({
            title: "Coming Soon",
            description: "Password reset functionality will be available soon.",
          });
          break;

        case 'reset-password':
          setSuccess('This feature will be available soon.');
          setMode('login');
          toast({
            title: "Coming Soon",
            description: "Password reset functionality will be available soon.",
          });
          break;
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
      case 'reset-password': return 'Set New Password';
      case 'verify-email': return 'Verifying Email';
      default: return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to your account';
      case 'register': return 'Join thousands of protected families';
      case 'forgot-password': return 'Enter your email to reset your password';
      case 'reset-password': return 'Enter your new password';
      case 'verify-email': return 'Please wait while we verify your email';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">LG</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">{getTitle()}</CardTitle>
          <p className="text-slate-600 mt-2">{getDescription()}</p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-emerald-200 bg-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">{success}</AlertDescription>
            </Alert>
          )}

          {mode === 'verify-email' ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Verifying your email...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-auth">
              {mode === 'register' && (
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="input-name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>

              {mode !== 'forgot-password' && (
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    {mode === 'reset-password' ? 'New Password' : 'Password'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="input-password"
                  />
                </div>
              )}

              {(mode === 'register' || mode === 'reset-password') && (
                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-between items-center">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className="ml-2 text-sm text-slate-600">Remember me</span>
                  </label>
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-brand-600 hover:text-brand-700 p-0"
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full btn-primary"
                data-testid="button-submit"
              >
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot-password' && 'Send Reset Email'}
                {mode === 'reset-password' && 'Reset Password'}
              </Button>

              <div className="text-center">
                <span className="text-slate-600 text-sm">
                  {mode === 'login' ? "Don't have an account?" : 
                   mode === 'register' ? "Already have an account?" :
                   mode === 'forgot-password' ? "Remember your password?" : ""}
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => {
                      if (mode === 'login') setMode('register');
                      else if (mode === 'register') setMode('login');
                      else if (mode === 'forgot-password') setMode('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-brand-600 hover:text-brand-700 font-medium ml-1 p-0"
                    data-testid="button-switch-mode"
                  >
                    {mode === 'login' ? 'Sign up' : 
                     mode === 'register' ? 'Sign in' :
                     mode === 'forgot-password' ? 'Sign in' : ''}
                  </Button>
                </span>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
