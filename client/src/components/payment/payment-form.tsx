import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Shield, ExternalLink } from "lucide-react";

interface PaymentFormProps {
  planName: string;
  planPrice: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ planName, planPrice, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setIsProcessing(true);
    setError(null);

    try {
      // Create subscription with Adumo
      const response = await apiRequest("POST", "/api/subscriptions/create", { planName });
      const data = await response.json();

      if (data.paymentUrl) {
        // Redirect to Adumo payment page
        toast({
          title: "Redirecting to Payment",
          description: "You'll be redirected to complete your payment securely with Adumo Online.",
        });
        
        // Add a small delay so user can see the message
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1500);
      } else {
        // Development mode or immediate activation
        toast({
          title: "Subscription Activated",
          description: `You've successfully subscribed to ${planName}!`,
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Subscription creation failed');
      toast({
        title: "Subscription Error",
        description: err.message || 'Failed to create subscription. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Complete Your Subscription</span>
        </CardTitle>
        <div className="text-sm text-slate-600">
          <p className="font-medium">{planName} Plan</p>
          <p>R{planPrice}/month</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Secure Payment with Adumo Online</p>
                <p className="text-blue-700">
                  You'll be redirected to our secure payment partner, Adumo Online, to complete your subscription.
                  Your payment information is protected with bank-level security.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Plan:</span>
              <span className="font-medium">{planName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Monthly Fee:</span>
              <span className="font-medium">R{planPrice}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Currency:</span>
              <span className="font-medium">South African Rand (ZAR)</span>
            </div>
            <hr className="border-slate-200" />
            <div className="flex items-center justify-between font-medium">
              <span>Total Monthly:</span>
              <span className="text-lg">R{planPrice}</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continue to Payment
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-slate-500 text-center">
            By clicking "Continue to Payment", you agree to our terms of service and will be redirected to Adumo Online to complete your payment securely.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}