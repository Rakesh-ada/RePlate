import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MealCard } from "@/components/meal-card";
import { QRModal } from "@/components/qr-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { FoodItemWithCreator, FoodClaimWithDetails } from "@shared/schema";
import { QrCode, Clock, CheckCircle, X } from "lucide-react";
import { formatTimeRemaining } from "@/lib/qr-utils";

export default function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [claimedMeal, setClaimedMeal] = useState<(FoodClaimWithDetails & { foodItem: any }) | null>(null);
  const [filters, setFilters] = useState({
    canteen: "all",
    mealType: "all",
  });

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const { data: foodItems = [], isLoading: itemsLoading } = useQuery<FoodItemWithCreator[]>({
    queryKey: ["/api/food-items"],
    enabled: !!user,
  });

  const { data: myClaims = [], isLoading: claimsLoading } = useQuery<FoodClaimWithDetails[]>({
    queryKey: ["/api/food-claims/my"],
    enabled: !!user,
  });

  const claimMutation = useMutation({
    mutationFn: async (foodItemId: string) => {
      const response = await apiRequest("POST", "/api/food-claims", {
        foodItemId,
        quantityClaimed: 1,
      });
      return response.json();
    },
    onSuccess: (newClaim) => {
      toast({
        title: "Meal Claimed Successfully!",
        description: "Your QR code is ready. Show it at the canteen to collect your meal.",
      });
      
      // Find the food item details
      const foodItem = foodItems.find(item => item.id === newClaim.foodItemId);
      setClaimedMeal({ ...newClaim, foodItem });
      setQrModalOpen(true);
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-claims/my"] });
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
        title: "Failed to Claim Meal",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClaimMeal = (foodItemId: string) => {
    if (claimMutation.isPending) return;
    setSelectedMeal(foodItemId);
    claimMutation.mutate(foodItemId);
  };

  // Filter food items
  const filteredItems = foodItems.filter(item => {
    if (filters.canteen !== "all" && item.canteenName !== filters.canteen) {
      return false;
    }
    // Add meal type filtering logic if needed
    return true;
  });

  // Get unique canteens for filter
  const canteens = Array.from(new Set(foodItems.map(item => item.canteenName)));

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Browse and claim discounted meals from campus canteens
          </p>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="browse">Browse Meals</TabsTrigger>
            <TabsTrigger value="claims">My Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={filters.canteen} onValueChange={(value) => setFilters(prev => ({ ...prev, canteen: value }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Canteens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Canteens</SelectItem>
                  {canteens.map(canteen => (
                    <SelectItem key={canteen} value={canteen}>
                      {canteen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.mealType} onValueChange={(value) => setFilters(prev => ({ ...prev, mealType: value }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Meals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meal Cards Grid */}
            {itemsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <QrCode className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No meals available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back later for new meal offerings from campus canteens.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onClaim={handleClaimMeal}
                    isLoading={claimMutation.isPending && selectedMeal === meal.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claims" className="space-y-6">
            {claimsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                        </div>
                        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myClaims.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Clock className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No claims yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start browsing meals to make your first claim.
                </p>
                <Button 
                  onClick={() => (document.querySelector('[value="browse"]') as HTMLElement)?.click()}
                  className="bg-forest hover:bg-forest-dark text-white"
                >
                  Browse Meals
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myClaims.map((claim) => (
                  <Card key={claim.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            {claim.status === "claimed" ? (
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : claim.status === "expired" ? (
                              <X className="w-8 h-8 text-red-600" />
                            ) : (
                              <QrCode className="w-8 h-8 text-forest" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {claim.foodItem.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {claim.foodItem.canteenName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              Claimed on {new Date(claim.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              claim.status === "claimed" ? "default" :
                              claim.status === "expired" ? "destructive" :
                              "secondary"
                            }
                            className="mb-2"
                          >
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                          {claim.status === "reserved" && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Expires: {formatTimeRemaining(claim.expiresAt.toString())}
                            </p>
                          )}
                          {claim.status === "claimed" && claim.claimedAt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Collected: {new Date(claim.claimedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {claim.status === "reserved" && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setClaimedMeal(claim as any);
                              setQrModalOpen(true);
                            }}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            View QR Code
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        claim={claimedMeal}
      />

      <Footer />
    </div>
  );
}
