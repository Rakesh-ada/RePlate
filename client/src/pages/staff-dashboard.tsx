import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertFoodItemSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { FoodItem } from "@shared/schema";
import { Plus, Utensils, TrendingUp, DollarSign, Edit, Trash2, MoreHorizontal, ShieldCheck, CheckCircle } from "lucide-react";
import { formatTimeRemaining } from "@/lib/qr-utils";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = insertFoodItemSchema.extend({
  availableUntil: z.string().min(1, "Availability end time is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function StaffDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Redirect if not staff
  if (!authLoading && (!user || user.role !== "staff")) {
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
    return null;
  }

  const { data: myItems = [], isLoading: itemsLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items/my"],
    enabled: !!user && user.role === "staff",
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      canteenName: "",
      canteenLocation: "",
      quantityAvailable: 1,
      originalPrice: "",
      discountedPrice: "",
      imageUrl: "",
      availableUntil: "",
      isActive: true,
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/food-items", {
        ...data,
        availableUntil: new Date(data.availableUntil).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Food Item Added",
        description: "Your food item has been added successfully.",
      });
      setAddItemModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Add Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: FormData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/food-items/${id}`, {
        ...updateData,
        availableUntil: new Date(updateData.availableUntil).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Food Item Updated",
        description: "Your food item has been updated successfully.",
      });
      setEditingItem(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Update Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/food-items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Food Item Deleted",
        description: "The food item has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Delete Item",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyClaimMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/food-claims/verify", { claimCode: code });
      return response.json();
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      if (result.success) {
        toast({
          title: "Claim Verified",
          description: `Meal "${result.claim.foodItem.name}" verified for student.`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const completeClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await apiRequest("POST", `/api/food-claims/${claimId}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      setVerificationResult(null);
      setClaimCode("");
      toast({
        title: "Meal Collected",
        description: "Student has successfully collected their meal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete claim.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingItem) {
      updateItemMutation.mutate({ ...data, id: editingItem.id });
    } else {
      addItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    const availableUntil = new Date(item.availableUntil);
    const localDateTime = new Date(availableUntil.getTime() - availableUntil.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    form.reset({
      name: item.name,
      description: item.description || "",
      canteenName: item.canteenName,
      canteenLocation: item.canteenLocation || "",
      quantityAvailable: item.quantityAvailable,
      originalPrice: item.originalPrice,
      discountedPrice: item.discountedPrice,
      imageUrl: item.imageUrl || "",
      availableUntil: localDateTime,
      isActive: item.isActive,
    });
    setAddItemModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this food item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setAddItemModalOpen(false);
    setEditingItem(null);
    form.reset();
  };

  // Calculate stats
  const activeItems = myItems.filter(item => item.isActive).length;
  const totalQuantity = myItems.reduce((sum, item) => sum + item.quantityAvailable, 0);
  const avgDiscount = myItems.length > 0 
    ? myItems.reduce((sum, item) => 
        sum + ((Number(item.originalPrice) - Number(item.discountedPrice)) / Number(item.originalPrice)) * 100, 0
      ) / myItems.length 
    : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Staff Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage food items and verify student claims
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-forest font-semibold text-2xl">{activeItems}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Items</p>
                </div>
                <Utensils className="text-forest w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-semibold text-2xl">{totalQuantity}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                </div>
                <TrendingUp className="text-blue-600 w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 font-semibold text-2xl">{avgDiscount.toFixed(0)}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Discount</p>
                </div>
                <DollarSign className="text-orange-600 w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="verify" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verify">Verify Claims</TabsTrigger>
            <TabsTrigger value="manage">Manage Items</TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="space-y-6">
            {/* Claim Code Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Verify Claim Code
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a student's claim code to verify and complete meal collection
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter claim code (e.g., ABC-XYZ)"
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      className="flex-1"
                      maxLength={7}
                    />
                    <Button
                      onClick={() => verifyClaimMutation.mutate(claimCode)}
                      disabled={!claimCode.trim() || verifyClaimMutation.isPending}
                      className="bg-forest hover:bg-forest-dark text-white"
                    >
                      {verifyClaimMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  </div>

                  {verificationResult && (
                    <div className="mt-4 p-4 border rounded-lg">
                      {verificationResult.success ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Valid Claim
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Student:</strong> {verificationResult.claim.user.firstName} {verificationResult.claim.user.lastName}
                            </div>
                            <div>
                              <strong>Email:</strong> {verificationResult.claim.user.email}
                            </div>
                            <div>
                              <strong>Meal:</strong> {verificationResult.claim.foodItem.name}
                            </div>
                            <div>
                              <strong>Canteen:</strong> {verificationResult.claim.foodItem.canteenName}
                            </div>
                            <div>
                              <strong>Price:</strong> ${verificationResult.claim.foodItem.discountedPrice}
                            </div>
                            <div>
                              <strong>Status:</strong> {verificationResult.claim.status}
                            </div>
                          </div>
                          <Button
                            onClick={() => completeClaimMutation.mutate(verificationResult.claim.id)}
                            disabled={completeClaimMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            {completeClaimMutation.isPending ? "Processing..." : "Complete Collection"}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <Badge variant="destructive">Invalid</Badge>
                          <p className="mt-2">{verificationResult.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            {/* Add Item Button */}
            <div className="flex justify-end">
              <Dialog open={addItemModalOpen} onOpenChange={handleModalClose}>
                <DialogTrigger asChild>
                  <Button className="bg-forest hover:bg-forest-dark text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Item
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Food Item" : "Add New Food Item"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Food Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Grilled Chicken Sandwich" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="canteenName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canteen Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., North Campus Dining" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the food item..."
                              className="min-h-[80px]"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="8.99" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="discountedPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discounted Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="4.99" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="quantityAvailable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity Available</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="5" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                        name="availableUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Until</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="canteenLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canteen Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Building A, Floor 1" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleModalClose}
                        disabled={addItemMutation.isPending || updateItemMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-forest hover:bg-forest-dark text-white"
                        disabled={addItemMutation.isPending || updateItemMutation.isPending}
                      >
                        {addItemMutation.isPending || updateItemMutation.isPending 
                          ? "Saving..." 
                          : editingItem 
                            ? "Update Item" 
                            : "Add Item"
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            {/* Food Items Table */}
            <Card>
          <CardHeader>
            <CardTitle>Your Food Items</CardTitle>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : myItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Utensils className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No food items yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by adding your first food item to the system.
                </p>
                <Button 
                  onClick={() => setAddItemModalOpen(true)}
                  className="bg-forest hover:bg-forest-dark text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Canteen</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Utensils className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {item.canteenName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-forest">
                              ${Number(item.discountedPrice).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              ${Number(item.originalPrice).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-white">
                            {item.quantityAvailable}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {formatTimeRemaining(item.availableUntil.toString())}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
