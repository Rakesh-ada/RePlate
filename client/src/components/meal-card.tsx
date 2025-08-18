import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Utensils } from "lucide-react";
import type { FoodItemWithCreator } from "@shared/schema";
import { formatTimeRemaining } from "@/lib/qr-utils";

interface MealCardProps {
  meal: FoodItemWithCreator;
  onClaim: (meal: FoodItemWithCreator) => void;
  isLoading?: boolean;
}

export function MealCard({ meal, onClaim, isLoading = false }: MealCardProps) {
  const timeRemaining = formatTimeRemaining(meal.availableUntil.toString());
  const isExpired = timeRemaining === "Expired";
  const isLowQuantity = meal.quantityAvailable <= 2;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-gray-800 border-gray-700">
      <CardContent className="p-0">
        <div className="relative">
          {meal.imageUrl ? (
            <img
              src={meal.imageUrl}
              alt={meal.name}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
              <Utensils className="w-12 h-12 text-gray-500" />
            </div>
          )}
          
          {/* Discount Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-500 hover:bg-red-600 text-white">
              {Math.round(((meal.originalPrice - meal.discountedPrice) / meal.originalPrice) * 100)}% OFF
            </Badge>
          </div>

          {/* Quantity Badge */}
          {isLowQuantity && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive">
                Only {meal.quantityAvailable} left!
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-white line-clamp-1">
              {meal.name}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
              {meal.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{meal.canteenName}</span>
            </div>
            {meal.canteenLocation && (
              <span className="text-xs">{meal.canteenLocation}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-green-500">
                ${Number(meal.discountedPrice).toFixed(2)}
              </span>
              <span className="text-lg text-gray-500 line-through">
                ${Number(meal.originalPrice).toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {meal.quantityAvailable} available
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            <span className={isExpired ? "text-red-500" : ""}>
              {timeRemaining}
            </span>
          </div>

          <Button
            onClick={() => onClaim(meal)}
            disabled={isLoading || isExpired || meal.quantityAvailable === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Claiming...
              </>
            ) : isExpired ? (
              "Expired"
            ) : meal.quantityAvailable === 0 ? (
              "Out of Stock"
            ) : (
              "Claim Meal"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}