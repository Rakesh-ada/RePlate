import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Utensils } from "lucide-react";
import type { FoodItemWithCreator } from "@shared/schema";
import { formatTimeRemaining } from "@/lib/qr-utils";

interface MealCardProps {
  meal: FoodItemWithCreator;
  onClaim: (mealId: string) => void;
  isLoading?: boolean;
}

export function MealCard({ meal, onClaim, isLoading = false }: MealCardProps) {
  const timeRemaining = formatTimeRemaining(meal.availableUntil.toString());
  const isExpired = timeRemaining === "Expired";
  const isLowQuantity = meal.quantityAvailable <= 2;

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
      {/* Meal Image */}
      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 dark:text-gray-600">
            <Utensils className="w-12 h-12" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
            {meal.name}
          </h3>
          <Badge 
            variant={isLowQuantity ? "destructive" : "secondary"}
            className="ml-2 shrink-0"
          >
            {meal.quantityAvailable} left
          </Badge>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {meal.description}
        </p>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{meal.canteenName}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-forest">
              ₹{Number(meal.discountedPrice).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
              ₹{Number(meal.originalPrice).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span className={`font-medium ${
              isExpired 
                ? "text-red-600" 
                : timeRemaining.includes("m left") && !timeRemaining.includes("h")
                  ? "text-orange-600"
                  : "text-green-600"
            }`}>
              {timeRemaining}
            </span>
          </div>
        </div>

        <Button
          onClick={() => onClaim(meal.id)}
          disabled={isLoading || isExpired || meal.quantityAvailable === 0}
          className="w-full bg-forest hover:bg-forest-dark text-white disabled:opacity-50"
        >
          {isLoading ? "Claiming..." : isExpired ? "Expired" : "Claim Meal"}
        </Button>
      </CardContent>
    </Card>
  );
}
