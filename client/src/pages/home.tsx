import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/");
      } else if (user.role === "staff") {
        setLocation("/staff");
      } else {
        setLocation("/student");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
