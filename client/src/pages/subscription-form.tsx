import React, { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Calculator } from 'lucide-react';
import Navbar from '@/components/layout/navbar';

// Form validation schema - cleaned up without banking fields
const subscriptionFormSchema = z.object({
  // Main Member Details
  title: z.string().min(1, 'Title is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  surname: z.string().min(1, 'Surname is required'),
  firstName: z.string().min(1, 'First name is required'),
  idNumber: z.string().length(13, 'ID number must be 13 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  physicalAddress: z.string().min(1, 'Physical address is required'),
  postalAddress: z.string().min(1, 'Postal address is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  contactNumber: z.string().min(10, 'Contact number is required'),
  email: z.string().email('Valid email is required'),
  
  // Partner Details (optional)
  partnerSurname: z.string().optional(),
  partnerFirstName: z.string().optional(),
  partnerIdNumber: z.string().optional(),
  partnerDateOfBirth: z.string().optional(),
  partnerAge: z.number().optional(),
  partnerMaidenName: z.string().optional(),
  
  // Employment Details
  selfEmployed: z.boolean(),
  mainOccupation: z.string().min(1, 'Occupation is required'),
  appointmentDate: z.string().optional(),
  permanentlyEmployed: z.boolean(),
  basicSalary: z.number().min(0, 'Salary must be positive'),
  employerName: z.string().min(1, 'Employer name is required'),
  employerAddress: z.string().min(1, 'Employer address is required'),
  employmentSector: z.enum(['GOVERNMENT', 'SEMI_GOVERNMENT', 'PRIVATE', 'INFORMAL']),
  salaryFrequency: z.enum(['MONTHLY', 'FORTNIGHTLY', 'WEEKLY']),
  salaryPaymentDay: z.number().min(1).max(31),
  
  // Terms and Conditions
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept privacy policy'),
});

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

// Age calculation from SA ID
function calculateAgeFromId(idNumber: string): number | null {
  if (!idNumber || idNumber.length !== 13) return null;
  
  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));
  
  const fullYear = year <= 22 ? 2000 + year : 1900 + year;
  const birthDate = new Date(fullYear, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 && age <= 120 ? age : null;
}

export default function SubscriptionForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/subscription-form/:planId');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      selfEmployed: false,
      permanentlyEmployed: true,
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  // Get selected plan details
  const { data: plansData } = useQuery({
    queryKey: ["/api/plans"],
  });

  const selectedPlan = (plansData as any)?.plans?.find((p: any) => p.id === params?.planId);

  // Watch ID number for age calculation
  const watchedIdNumber = form.watch('idNumber');
  const watchedPartnerIdNumber = form.watch('partnerIdNumber');

  useEffect(() => {
    const age = calculateAgeFromId(watchedIdNumber);
    if (age) {
      form.setValue('age', age);
      form.setValue('dateOfBirth', `${watchedIdNumber.substring(0, 2)}/${watchedIdNumber.substring(2, 4)}/${watchedIdNumber.substring(4, 6)}`);
    }
  }, [watchedIdNumber, form]);

  useEffect(() => {
    const age = calculateAgeFromId(watchedPartnerIdNumber || '');
    if (age) {
      form.setValue('partnerAge', age);
      form.setValue('partnerDateOfBirth', `${watchedPartnerIdNumber?.substring(0, 2)}/${watchedPartnerIdNumber?.substring(2, 4)}/${watchedPartnerIdNumber?.substring(4, 6)}`);
    }
  }, [watchedPartnerIdNumber, form]);

  // Simplified quote calculation - only plan price
  const calculateQuote = () => {
    const planPrice = parseFloat(selectedPlan?.price) || 0;
    return {
      planPrice,
      totalPrice: planPrice
    };
  };

  // Submit subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const quote = calculateQuote();
      
      // Create subscription with simplified data
      const subscriptionData = {
        planId: params?.planId,
        mainMemberDetails: {
          title: data.title,
          gender: data.gender,
          surname: data.surname,
          firstName: data.firstName,
          idNumber: data.idNumber,
          dateOfBirth: data.dateOfBirth,
          age: data.age,
          physicalAddress: data.physicalAddress,
          postalAddress: data.postalAddress,
          postalCode: data.postalCode,
          contactNumber: data.contactNumber,
          email: data.email,
        },
        partnerDetails: data.partnerSurname ? {
          surname: data.partnerSurname,
          firstName: data.partnerFirstName,
          idNumber: data.partnerIdNumber,
          dateOfBirth: data.partnerDateOfBirth,
          age: data.partnerAge,
          maidenName: data.partnerMaidenName,
        } : null,
        employmentDetails: {
          selfEmployed: data.selfEmployed,
          mainOccupation: data.mainOccupation,
          appointmentDate: data.appointmentDate,
          permanentlyEmployed: data.permanentlyEmployed,
          basicSalary: data.basicSalary,
          employerName: data.employerName,
          employerAddress: data.employerAddress,
          employmentSector: data.employmentSector,
          salaryFrequency: data.salaryFrequency,
          salaryPaymentDay: data.salaryPaymentDay,
        },
        totalAmount: quote.totalPrice,
        planAmount: quote.planPrice,
      };

      return apiRequest('POST', '/api/subscriptions/create-full', subscriptionData);
    },
    onSuccess: (result: any) => {
      // Check if payment is required (Adumo redirect)
      if (result.requiresPayment && result.paymentData) {
        const { url, formData } = result.paymentData;
        
        // Create and submit a form to redirect to Adumo
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        
        // Add all form data as hidden inputs
        Object.entries(formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        return; // Don't proceed to dashboard redirect
      }
      
      // Handle normal subscription without payment redirect
      if (result.message && result.message.includes('already exists')) {
        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription to this plan. Redirecting to dashboard.",
        });
      } else {
        toast({
          title: "Subscription Created",
          description: "Your subscription has been activated successfully!",
        });
      }
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Failed to create subscription";
      
      if (errorMessage.includes('already subscribed')) {
        errorMessage = "You already have an active subscription to this plan. Please go to your dashboard to manage it.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubscriptionFormData) => {
    createSubscriptionMutation.mutate(data);
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Plan not found</p>
            <Button onClick={() => setLocation('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quote = calculateQuote();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscribe to {selectedPlan.name}
            </h1>
            <p className="text-gray-600">
              Complete your subscription form below
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Column */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Main Member Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-800 bg-blue-100 p-3 rounded">
                  MAIN MEMBER DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-title">
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr.</SelectItem>
                              <SelectItem value="Mrs">Mrs.</SelectItem>
                              <SelectItem value="Ms">Ms.</SelectItem>
                              <SelectItem value="Dr">Dr.</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            readOnly 
                            className="bg-gray-100"
                            data-testid="input-age"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-surname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Names</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-firstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I.D. Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            maxLength={13} 
                            placeholder="13-digit ID number"
                            data-testid="input-idNumber"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>D.O.B</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            readOnly 
                            className="bg-gray-100"
                            data-testid="input-dateOfBirth"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-physicalAddress" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Address</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-postalAddress" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-postalCode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-contactNumber" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Partner Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-800 bg-blue-100 p-3 rounded">
                  PARTNER DETAILS (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partnerSurname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-partnerSurname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="partnerFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Names</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-partnerFirstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partnerIdNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I.D. Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            maxLength={13} 
                            placeholder="13-digit ID number"
                            data-testid="input-partnerIdNumber"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="partnerDateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>D.O.B</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            readOnly 
                            className="bg-gray-100"
                            data-testid="input-partnerDateOfBirth"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partnerMaidenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maiden Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-partnerMaidenName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="partnerAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            readOnly 
                            className="bg-gray-100"
                            data-testid="input-partnerAge"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-800 bg-blue-100 p-3 rounded">
                  EMPLOYMENT DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="selfEmployed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-selfEmployed"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Are you self employed?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="permanentlyEmployed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-permanentlyEmployed"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Are you permanently employed?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mainOccupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Occupation</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-mainOccupation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Date (if applicable)</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-appointmentDate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="basicSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basic Salary (R)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-basicSalary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-employerName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="employmentSector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Sector</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-employmentSector">
                              <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GOVERNMENT">Government</SelectItem>
                              <SelectItem value="SEMI_GOVERNMENT">Semi-Government</SelectItem>
                              <SelectItem value="PRIVATE">Private</SelectItem>
                              <SelectItem value="INFORMAL">Informal</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="employerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-employerAddress" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Frequency</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-salaryFrequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salaryPaymentDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Payment Day</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="31"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-salaryPaymentDay"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quote Summary */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-xl text-blue-800 flex items-center">
                  <Calculator className="w-6 h-6 mr-2" />
                  SUBSCRIPTION QUOTE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedPlan.name} Plan:</span>
                    <span className="font-medium">R{quote.planPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Monthly Premium:</span>
                      <span className="text-blue-600">R{quote.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-acceptTerms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the{' '}
                            <a href="/terms" className="text-blue-600 underline" target="_blank">
                              Terms and Conditions
                            </a>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="acceptPrivacy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-acceptPrivacy"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the{' '}
                            <a href="/privacy" className="text-blue-600 underline" target="_blank">
                              Privacy Policy
                            </a>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto min-w-[300px] bg-blue-600 hover:bg-blue-700"
                disabled={createSubscriptionMutation.isPending}
                data-testid="button-submit-subscription"
              >
                {createSubscriptionMutation.isPending ? (
                  "Activating Subscription..."
                ) : (
                  `Activate Subscription - R${quote.totalPrice.toFixed(2)}/month`
                )}
              </Button>
            </div>
              </form>
            </Form>
          </div>
          
          {/* Quote Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-lg border-2 border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="flex items-center text-lg">
                    <Calculator className="w-5 h-5 mr-2" />
                    Your Quote
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Plan Details */}
                    <div className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">{selectedPlan.name} Plan</span>
                        <span className="font-semibold text-blue-600">R{parseFloat(selectedPlan.price).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-500">{selectedPlan.description}</p>
                    </div>

                    {/* Total */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Monthly Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          R{quote.totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Billed monthly • Cancel anytime
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}