import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Leaf, User } from "lucide-react";
import { MealCard } from "@/components/meal-card";
import { QRModal } from "@/components/qr-modal";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeRemaining } from "@/lib/qr-utils";
import type { FoodItemWithCreator, FoodClaimWithDetails } from "@shared/schema";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<FoodClaimWithDetails | null>(null);
  const queryClient = useQueryClient();

  const { data: foodItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/food-items"],
  });

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/food-claims/my"],
  });

  const claimMutation = useMutation({
    mutationFn: async (foodItemId: string) => {
      return apiRequest("/api/food-claims", {
        method: "POST",
        body: JSON.stringify({ foodItemId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-claims/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    },
  });

  const filteredItems = foodItems.filter((item: FoodItemWithCreator) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.canteenName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClaims = claims.filter((claim: FoodClaimWithDetails) => 
    claim.status === "reserved" || claim.status === "claimed"
  );

  const claimHistory = claims.filter((claim: FoodClaimWithDetails) => 
    claim.status === "expired" || claim.status === "cancelled"
  );

  const handleClaimMeal = async (foodItem: FoodItemWithCreator) => {
    try {
      await claimMutation.mutateAsync(foodItem.id);
    } catch (error) {
      console.error("Failed to claim meal:", error);
    }
  };

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={() => window.location.href = "/"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Leaf className="text-white w-3 h-3" />
              </div>
              <span className="text-white font-semibold text-lg">RePlate Campus</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-green-400 text-sm">
            <User className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Card */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Campus Food Claims</h1>
                <p className="text-gray-400">Claim available meals and show your QR code for pickup!</p>
              </div>
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{filteredItems.length}</div>
                  <div className="text-gray-400 text-sm">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{activeClaims.length}</div>
                  <div className="text-gray-400 text-sm">Claims</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700 mb-6">
            <TabsTrigger 
              value="available" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
            >
              Available
            </TabsTrigger>
            <TabsTrigger 
              value="claims" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
            >
              Claims ({activeClaims.length})
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search food items, canteens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Available Meals */}
            {itemsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading available meals...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Items Available</h3>
                <p className="text-gray-500">Check back soon for new items!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item: FoodItemWithCreator) => (
                  <MealCard
                    key={item.id}
                    meal={item}
                    onClaim={handleClaimMeal}
                    isLoading={claimMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claims">
            {claimsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your claims...</p>
              </div>
            ) : activeClaims.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Claims</h3>
                <p className="text-gray-500 mb-4">Start browsing meals to make your first claim.</p>
                <Button 
                  onClick={() => (document.querySelector('[value="available"]') as HTMLElement)?.click()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Browse Meals
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeClaims.map((claim: FoodClaimWithDetails) => (
                  <Card key={claim.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🍽️</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{claim.foodItem.name}</h3>
                            <p className="text-sm text-gray-400">{claim.foodItem.canteenName}</p>
                            <p className="text-sm text-gray-500">
                              Claimed on {new Date(claim.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-500 mb-2">
                            ${Number(claim.foodItem.discountedPrice).toFixed(2)}
                          </div>
                          <Badge variant={claim.status === "reserved" ? "secondary" : "default"}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                          {claim.status === "reserved" && (
                            <p className="text-sm text-gray-400">
                              Expires: {formatTimeRemaining(claim.expiresAt.toString())}
                            </p>
                          )}
                          {claim.status === "claimed" && claim.claimedAt && (
                            <p className="text-sm text-gray-400">
                              Claimed: {new Date(claim.claimedAt).toLocaleDateString()}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            Show QR Code
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {claimHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No History Yet</h3>
                <p className="text-gray-500">Your claim history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claimHistory.map((claim: FoodClaimWithDetails) => (
                  <Card key={claim.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center opacity-50">
                            <span className="text-2xl">🍽️</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-300">{claim.foodItem.name}</h3>
                            <p className="text-sm text-gray-500">{claim.foodItem.canteenName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(claim.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-500 mb-2">
                            ${Number(claim.foodItem.discountedPrice).toFixed(2)}
                          </div>
                          <Badge variant="outline" className="text-gray-500 border-gray-600">
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Modal */}
      {selectedClaim && (
        <QRModal
          claim={selectedClaim}
          isOpen={!!selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  );
}