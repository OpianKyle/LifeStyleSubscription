import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ShieldCheck, Save, X } from 'lucide-react';

// Function to calculate age from South African ID number
function calculateAgeFromId(idNumber: string): number | null {
  if (!idNumber || idNumber.length !== 13) return null;
  
  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));
  
  // Determine century (00-22 = 2000s, 23-99 = 1900s)
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

// Function to get available cover amounts based on age
function getAvailableCoverAmounts(age: number | null): number[] {
  if (!age) return [10000, 15000, 20000, 25000, 30000];
  
  // People under 50 can get up to R100,000, people over 50 can get up to R30,000
  if (age < 50) {
    return [10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];
  } else {
    return [10000, 15000, 20000, 25000, 30000];
  }
}

// Premium calculation function based on the provided tables
function calculatePremium(age: number, relation: string, coverAmount: number): number {
  const coverPer1000 = coverAmount / 1000;
  
  // Single Funeral Cover rates (main member and spouse)
  if (relation === 'SPOUSE') {
    if (age >= 18 && age <= 45) return coverPer1000 * 2.55;
    if (age >= 46 && age <= 50) return coverPer1000 * 2.95;
    if (age >= 51 && age <= 60) return coverPer1000 * 3.55;
    if (age >= 61 && age <= 70) return coverPer1000 * 3.55;
  }
  
  // Children rates (0-20)
  if (relation === 'CHILD') {
    if (age >= 0 && age <= 5) return coverPer1000 * 1.95;
    if (age >= 6 && age <= 13) return coverPer1000 * 2.05;
    if (age >= 14 && age <= 20) return coverPer1000 * 2.25;
  }
  
  // Parent funeral benefit (up to 75)
  if (relation === 'PARENT') {
    if (age >= 18 && age <= 25) return coverPer1000 * 2.48;
    if (age >= 26 && age <= 30) return coverPer1000 * 3.88;
    if (age >= 31 && age <= 35) return coverPer1000 * 4.72;
    if (age >= 36 && age <= 40) return coverPer1000 * 5.48;
    if (age >= 41 && age <= 45) return coverPer1000 * 5.64;
    if (age >= 46 && age <= 50) return coverPer1000 * 6.44;
    if (age >= 51 && age <= 55) return coverPer1000 * 6.44;
    if (age >= 56 && age <= 60) return coverPer1000 * 8.94;
    if (age >= 61 && age <= 65) return coverPer1000 * 13.12;
    if (age >= 66 && age <= 70) return coverPer1000 * 20.08;
    if (age >= 71 && age <= 75) return coverPer1000 * 21.84;
  }
  
  // Extended family cover (18-64)
  if (relation === 'EXTENDED_FAMILY') {
    if (age >= 18 && age <= 45) return coverPer1000 * 2.55;
    if (age >= 46 && age <= 55) return coverPer1000 * 3.55;
    if (age >= 56 && age <= 64) return coverPer1000 * 4.55;
  }
  
  // Default fallback
  return coverPer1000 * 2.55;
}

interface FamilyMember {
  id?: string;
  name: string;
  surname: string;
  idNumber: string;
  relation: 'SPOUSE' | 'CHILD' | 'PARENT' | 'EXTENDED_FAMILY';
  coverAmount: number;
  age?: number;
  monthlyPremium?: string;
  isNew?: boolean;
}

const relationLabels = {
  'SPOUSE': 'Spouse/Partner',
  'CHILD': 'Child',
  'PARENT': 'Parent',
  'EXTENDED_FAMILY': 'Extended Family'
};

export default function ExtendedCoverSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: coversData, isLoading } = useQuery({
    queryKey: ["/api/extended-cover"],
  });

  // Update family members when data changes
  useEffect(() => {
    if (coversData) {
      const covers = (coversData as any)?.covers || [];
      setFamilyMembers(covers);
    }
  }, [coversData]);

  const covers = (coversData as any)?.covers || [];

  const createCoverMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/extended-cover", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extended-cover"] });
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/extended-cover/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extended-cover"] });
      setEditingId(null);
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

  const addNewMember = () => {
    const newMember: FamilyMember = {
      id: `new-${Date.now()}`,
      name: '',
      surname: '',
      idNumber: '',
      relation: 'SPOUSE',
      coverAmount: 5000,
      isNew: true
    };
    setFamilyMembers([...familyMembers, newMember]);
    setEditingId(newMember.id!);
  };

  const saveMember = async (member: FamilyMember) => {
    if (!member.name || !member.surname || !member.idNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const age = calculateAgeFromId(member.idNumber);
    if (!age) {
      toast({
        title: "Invalid ID Number",
        description: "Please enter a valid 13-digit South African ID number.",
        variant: "destructive",
      });
      return;
    }

    const memberData = {
      name: member.name,
      surname: member.surname,
      idNumber: member.idNumber,
      age,
      relation: member.relation,
      coverAmount: member.coverAmount
    };

    if (member.isNew) {
      await createCoverMutation.mutateAsync(memberData);
      setFamilyMembers(prev => prev.filter(m => m.id !== member.id));
    } else {
      await updateCoverMutation.mutateAsync({ id: member.id!, data: memberData });
    }
  };

  const cancelEdit = (memberId: string) => {
    if (familyMembers.find(m => m.id === memberId)?.isNew) {
      setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
    }
    setEditingId(null);
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: any) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
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
            
            <Button 
              onClick={addNewMember}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
              data-testid="button-add-family-member"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Member
            </Button>
          </div>
        </div>
      </div>

      {/* Family Members Table */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Family Members Extended Cover</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading extended cover...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Surname</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Cover Amount</TableHead>
                    <TableHead>Monthly Premium</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyMembers.length === 0 && covers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-600">
                          <p className="mb-4">No family members added yet.</p>
                          <Button onClick={addNewMember} data-testid="button-add-first-member">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Family Member
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Existing members from database */}
                      {covers.map((cover: any) => (
                        <TableRow key={cover.id}>
                          <TableCell>{cover.name}</TableCell>
                          <TableCell>{cover.surname}</TableCell>
                          <TableCell>{cover.idNumber}</TableCell>
                          <TableCell>{cover.age}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {relationLabels[cover.relation as keyof typeof relationLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>R{Number(cover.coverAmount).toLocaleString()}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            R{Number(cover.monthlyPremium).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(cover.id)}
                                data-testid={`button-edit-${cover.id}`}
                              >
                                Edit
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
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* New members being added/edited */}
                      {familyMembers.filter(m => m.isNew || editingId === m.id).map((member) => (
                        <TableRow key={member.id} className="bg-blue-50">
                          <TableCell>
                            <Input
                              value={member.name}
                              onChange={(e) => updateMember(member.id!, 'name', e.target.value)}
                              placeholder="First name"
                              className="w-full"
                              data-testid={`input-name-${member.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={member.surname}
                              onChange={(e) => updateMember(member.id!, 'surname', e.target.value)}
                              placeholder="Last name"
                              className="w-full"
                              data-testid={`input-surname-${member.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={member.idNumber}
                              onChange={(e) => updateMember(member.id!, 'idNumber', e.target.value)}
                              placeholder="13-digit ID"
                              maxLength={13}
                              className="w-full"
                              data-testid={`input-id-${member.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            {calculateAgeFromId(member.idNumber) || '-'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={member.relation}
                              onValueChange={(value) => updateMember(member.id!, 'relation', value)}
                            >
                              <SelectTrigger className="w-full" data-testid={`select-relation-${member.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SPOUSE">Spouse/Partner</SelectItem>
                                <SelectItem value="CHILD">Child</SelectItem>
                                <SelectItem value="PARENT">Parent</SelectItem>
                                <SelectItem value="EXTENDED_FAMILY">Extended Family</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={member.coverAmount?.toString() || ""}
                              onValueChange={(value) => updateMember(member.id!, 'coverAmount', Number(value))}
                            >
                              <SelectTrigger className="w-full" data-testid={`select-amount-${member.id}`}>
                                <SelectValue placeholder="Select amount" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableCoverAmounts(calculateAgeFromId(member.idNumber)).map((amount) => (
                                  <SelectItem key={amount} value={amount.toString()}>
                                    R{amount.toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const age = calculateAgeFromId(member.idNumber);
                              if (!age || !member.coverAmount) return '-';
                              const premium = calculatePremium(age, member.relation, member.coverAmount);
                              return `R${premium.toFixed(2)}`;
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveMember(member)}
                                disabled={createCoverMutation.isPending || updateCoverMutation.isPending}
                                data-testid={`button-save-${member.id}`}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelEdit(member.id!)}
                                data-testid={`button-cancel-${member.id}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}