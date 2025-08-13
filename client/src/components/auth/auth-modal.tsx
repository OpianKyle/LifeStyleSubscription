import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

type AuthMode = 'login' | 'register' | 'forgot-password';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export default function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const { toast } = useToast();
  const { 
    login, 
    register, 
    requestPasswordReset,
    isLoginPending,
    isRegisterPending 
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      switch (mode) {
        case 'login':
          await login({ email: formData.email, password: formData.password });
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          });
          onOpenChange(false);
          break;

        case 'register':
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
          }
          const result = await register({ 
            email: formData.email, 
            password: formData.password, 
            name: formData.name 
          });
          setSuccess(result.message);
          setMode('login');
          toast({
            title: "Registration Successful",
            description: "Please check your email to verify your account.",
          });
          break;

        case 'forgot-password':
          await requestPasswordReset(formData.email);
          setSuccess('Password reset email sent. Please check your inbox.');
          toast({
            title: "Reset Email Sent",
            description: "Please check your email for reset instructions.",
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
      default: return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to your account';
      case 'register': return 'Join thousands of protected families';
      case 'forgot-password': return 'Enter your email to reset your password';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">LG</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900">{getTitle()}</DialogTitle>
          <p className="text-slate-600 mt-2">{getDescription()}</p>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-auth-modal">
          {mode === 'register' && (
            <div>
              <Label htmlFor="modal-name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</Label>
              <Input
                id="modal-name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="modal-input-name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="modal-email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="modal-input-email"
            />
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <Label htmlFor="modal-password" className="block text-sm font-medium text-slate-700 mb-2">Password</Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="modal-input-password"
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <Label htmlFor="modal-confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</Label>
              <Input
                id="modal-confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                data-testid="modal-input-confirm-password"
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
                data-testid="modal-button-forgot-password"
              >
                Forgot password?
              </Button>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full btn-primary"
            disabled={isLoginPending || isRegisterPending}
            data-testid="modal-button-submit"
          >
            {isLoginPending || isRegisterPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Please wait...</span>
              </div>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot-password' && 'Send Reset Email'}
              </>
            )}
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
                data-testid="modal-button-switch-mode"
              >
                {mode === 'login' ? 'Sign up' : 
                 mode === 'register' ? 'Sign in' :
                 mode === 'forgot-password' ? 'Sign in' : ''}
              </Button>
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
