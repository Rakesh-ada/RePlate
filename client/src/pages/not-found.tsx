import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-green-50 relative overflow-hidden">
      {/* Floating React logos for fun */}

      <Card className="w-full max-w-md mx-4 shadow-lg border-green-200 bg-white/95 backdrop-blur-sm relative z-10">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-green-700" />
          </div>

          <h1 className="text-3xl font-extrabold text-green-800">
            404 - Page Not Found
          </h1>

          <p className="mt-3 text-sm text-green-700">
            This page seems to have wandered off
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
