
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import EnterpriseAnalysis from "./pages/EnterpriseAnalysis";
import NotFound from "./pages/NotFound";
import AdvancedAnalysis from "./pages/AdvancedAnalysis";
import AuthPage from "./pages/AuthPage";
import Navigation from "@/components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navigation />
                    <EnterpriseAnalysis />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classic"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navigation />
                    <Index />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/advanced"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col">
                    <Navigation />
                    <AdvancedAnalysis />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
