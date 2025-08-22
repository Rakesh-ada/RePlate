import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import StudentDashboard from "@/pages/student-dashboard";
import StaffDashboard from "@/pages/staff-dashboard";
import Signup from "@/pages/signup";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/signup" />;
  }
  
  return children;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes - These should come first */}
      <Route path="/" component={Landing} />
      <Route path="/signup" component={Signup} />
      
      {/* Protected Routes */}
      <Route path="/student">
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/staff">
        <ProtectedRoute>
          <StaffDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
