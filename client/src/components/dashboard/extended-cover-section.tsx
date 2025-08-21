import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, ShieldCheck } from 'lucide-react';

const extendedCoverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  surname: z.string().min(2, 'Surname must be at least 2 characters'),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.number().min(0).max(120),
  relation: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'EXTENDED_FAMILY']),
  coverAmount: z.number().min(1000, 'Minimum cover amount is R1,000')
});

type ExtendedCoverFormData = z.infer<typeof extendedCoverSchema>;

const relationLabels = {
  'SPOUSE': 'Spouse/Partner',
  'CHILD': 'Child',
  'PARENT': 'Parent',
  'EXTENDED_FAMILY': 'Extended Family'
};

export default function ExtendedCoverSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCover, setEditingCover] = useState<any>(null);

  const { data: coversData, isLoading } = useQuery({
    queryKey: ["/api/extended-cover"],
  });

  const covers = (coversData as any)?.covers || [];

  const form = useForm<ExtendedCoverFormData>({
    resolver: zodResolver(extendedCoverSchema),
    defaultValues: {
      name: '',
      surname: '',
      idNumber: '',
      dateOfBirth: '',
      age: 0,
      relation: 'SPOUSE',
      coverAmount: 5000
    }
  });

  const createCoverMutation = useMutation({
    mutationFn: async (data: ExtendedCoverFormData) => {
      const response = await apiRequest("POST", "/api/extended-cover", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extended-cover"] });
      setIsModalOpen(false);
      form.reset();
      toast({
        title: "Extended Cover Added",
        description: "Family member has been added to your extended cover.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add extended cover.",
        variant: "destructive",
      });
    },
  });

  const updateCoverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExtendedCoverFormData> }) => {
      const response = await apiRequest("PUT", `/api/extended-cover/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extended-cover"] });
      setIsModalOpen(false);
      setEditingCover(null);
      form.reset();
      toast({
        title: "Extended Cover Updated",
        description: "Family member's cover has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update extended cover.",
        variant: "destructive",
      });
    },
  });

  const deleteCoverMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/extended-cover/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extended-cover"] });
      toast({
        title: "Extended Cover Removed",
        description: "Family member has been removed from your extended cover.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove extended cover.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExtendedCoverFormData) => {
    if (editingCover) {
      updateCoverMutation.mutate({ id: editingCover.id, data });
    } else {
      createCoverMutation.mutate(data);
    }
  };

  const handleEdit = (cover: any) => {
    setEditingCover(cover);
    form.reset({
      name: cover.name,
      surname: cover.surname,
      idNumber: cover.idNumber || '',
      dateOfBirth: cover.dateOfBirth || '',
      age: cover.age,
      relation: cover.relation,
      coverAmount: Number(cover.coverAmount)
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this family member from extended cover?')) {
      deleteCoverMutation.mutate(id);
    }
  };

  const totalPremium = covers.reduce((sum: number, cover: any) => sum + Number(cover.monthlyPremium), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border border-amber-200/50 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-300/5 to-amber-500/10"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-300/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-900">Extended Cover</h2>
                  <p className="text-amber-700/80">Protect your family with additional funeral cover</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/50">
                  <div className="text-amber-900 font-semibold">Family Members</div>
                  <div className="text-2xl font-bold text-amber-800">{covers.length}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/50">
                  <div className="text-amber-900 font-semibold">Total Coverage</div>
                  <div className="text-2xl font-bold text-amber-800">
                    R{covers.reduce((sum: number, cover: any) => sum + Number(cover.coverAmount), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/50">
                  <div className="text-amber-900 font-semibold">Monthly Premium</div>
                  <div className="text-2xl font-bold text-amber-800">R{totalPremium.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingCover(null);
                    form.reset();
                  }}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                  data-testid="button-add-family-member"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family Member
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Family Members List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading extended cover...</p>
          </div>
        ) : covers.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Family Members Added</h3>
              <p className="text-gray-600 mb-4">Add family members to extend your funeral cover protection.</p>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setEditingCover(null);
                      form.reset();
                    }}
                    data-testid="button-add-first-member"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Family Member
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          covers.map((cover: any) => (
            <Card key={cover.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {cover.name.charAt(0)}{cover.surname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cover.name} {cover.surname}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <Badge variant="secondary">{relationLabels[cover.relation as keyof typeof relationLabels]}</Badge>
                        <span>Age: {cover.age}</span>
                        <span>Coverage: R{Number(cover.coverAmount).toLocaleString()}</span>
                        <span className="font-medium text-green-600">Premium: R{Number(cover.monthlyPremium).toFixed(2)}/month</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cover)}
                      data-testid={`button-edit-${cover.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cover.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-${cover.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCover ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surname</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} data-testid="input-surname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-relation">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SPOUSE">Spouse/Partner</SelectItem>
                      <SelectItem value="CHILD">Child</SelectItem>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="EXTENDED_FAMILY">Extended Family</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="25" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Amount (R)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5000" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-cover-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="9001010000000" {...field} data-testid="input-id-number" />
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
                  <FormLabel>Date of Birth (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-date-of-birth" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCover(null);
                  form.reset();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCoverMutation.isPending || updateCoverMutation.isPending}
                data-testid="button-save"
              >
                {createCoverMutation.isPending || updateCoverMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </div>
  );
}