import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Share2, Copy } from "lucide-react";
import { formatTimeRemaining } from "@/lib/qr-utils";
import { useToast } from "@/hooks/use-toast";
import type { FoodClaim, FoodItem } from "@shared/schema";

interface ClaimCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: (FoodClaim & { foodItem: FoodItem }) | null;
}

export function ClaimCodeModal({ isOpen, onClose, claim }: ClaimCodeModalProps) {
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (!claim?.claimCode) return;

    navigator.clipboard.writeText(claim.claimCode);
    toast({
      title: "Claim Code Copied",
      description: "Your claim code has been copied to clipboard.",
    });
  };

  const handleShare = async () => {
    if (!claim) return;

    const shareData = {
      title: "RePlate Campus - Meal Claim",
      text: `I've claimed a meal: ${claim.foodItem.name}. Claim code: ${claim.claimCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Your meal claim has been shared.",
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copy text
      navigator.clipboard.writeText(shareData.text);
      toast({
        title: "Text Copied",
        description: "Claim details have been copied to clipboard.",
      });
    }
  };

  if (!claim) return null;

  const timeRemaining = formatTimeRemaining(claim.expiresAt.toString());
  const isExpired = timeRemaining === "Expired";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600 dark:text-green-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Meal Claimed Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">
                Show this claim code to canteen staff to collect your meal
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Claim Code Display */}
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Claim Code</p>
              <div className="text-3xl font-mono font-bold text-forest dark:text-forest-light tracking-widest">
                {claim.claimCode}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Give this code to canteen staff
              </p>
            </div>
          </div>

          {/* Claim Details */}
          <div className="bg-forest/10 dark:bg-forest/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Expires in:</span>
              <Badge variant={isExpired ? "destructive" : "secondary"}>
                {timeRemaining}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Claim ID:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                #{claim.id.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Meal:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {claim.foodItem.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Canteen:</span>
              <span className="text-gray-900 dark:text-white">
                {claim.foodItem.canteenName}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="flex items-center"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy Code
            </Button>
          </div>

          <div className="text-center">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}