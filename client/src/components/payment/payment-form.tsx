import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Lock } from "lucide-react";

let stripePromise: Promise<Stripe | null> | null = null;

interface PaymentFormProps {
  planName: string;
  planPrice: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentFormInner({ planName, planPrice, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create subscription and get client secret
      const response = await apiRequest("POST", "/api/subscriptions/create", { planName });
      const data = await response.json();

      if (data.clientSecret) {
        // Confirm payment with Stripe
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: cardElement,
            }
          }
        );

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (paymentIntent?.status === 'succeeded') {
          toast({
            title: "Payment Successful",
            description: `You've successfully subscribed to ${planName}!`,
          });
          onSuccess();
        }
      } else {
        // Development mode or immediate activation
        toast({
          title: "Subscription Created",
          description: `You've successfully subscribed to ${planName}!`,
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      toast({
        title: "Payment Failed",
        description: err.message || 'Payment failed',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Payment Details</span>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Card Information
            </label>
            <div className="p-3 border border-slate-300 rounded-md">
              <CardElement options={cardOptions} />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
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
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay R{planPrice}/month</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        if (!stripePromise) {
          const response = await apiRequest('GET', '/api/config/stripe');
          const config = await response.json();
          
          if (config.publishableKey) {
            stripePromise = loadStripe(config.publishableKey);
          }
        }
        
        if (stripePromise) {
          setStripe(stripePromise);
        } else {
          setError('Payment processing is not configured');
        }
      } catch (err) {
        setError('Failed to initialize payment system');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading payment form...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !stripe) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Payment processing is not configured. Please contact support.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripe}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}