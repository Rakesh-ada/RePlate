import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Share2, Copy } from "lucide-react";
import { generateQRCodeDataURL, formatTimeRemaining } from "@/lib/qr-utils";
import { useToast } from "@/hooks/use-toast";
import type { FoodClaim, FoodItem } from "@shared/schema";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: (FoodClaim & { foodItem: FoodItem }) | null;
}

export function QRModal({ isOpen, onClose, claim }: QRModalProps) {
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (claim?.qrCode) {
      const dataURL = generateQRCodeDataURL(claim.qrCode);
      setQrDataURL(dataURL);
    }
  }, [claim?.qrCode]);

  const handleDownload = () => {
    if (!qrDataURL || !claim) return;

    const link = document.createElement("a");
    link.download = `replate-qr-${claim.id}.png`;
    link.href = qrDataURL;
    link.click();

    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been saved to your device.",
    });
  };

  const handleShare = async () => {
    if (!claim) return;

    const shareData = {
      title: "RePlate Campus - Meal Claim",
      text: `I've claimed a meal: ${claim.foodItem.name}`,
      url: `${window.location.origin}/claim/${claim.qrCode}`,
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
      // Fallback to copy URL
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link Copied",
        description: "Claim link has been copied to clipboard.",
      });
    }
  };

  const handleCopyQR = () => {
    if (!claim?.qrCode) return;

    navigator.clipboard.writeText(claim.qrCode);
    toast({
      title: "QR Code Copied",
      description: "QR code has been copied to clipboard.",
    });
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
                Show this QR code at the canteen to collect your meal
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              {qrDataURL ? (
                <img
                  src={qrDataURL}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generating QR Code...</p>
                  </div>
                </div>
              )}
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
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
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
              onClick={handleCopyQR}
              className="flex items-center"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
