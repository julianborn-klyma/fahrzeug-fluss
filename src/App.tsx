import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { DataProvider } from '@/context/DataContext';
import { BonusSettingsProvider } from '@/context/BonusSettingsContext';
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

const RoleSelectPage = lazy(() => import("./pages/RoleSelectPage"));
const MonteurVehicleSelect = lazy(() => import("./pages/MonteurVehicleSelect"));
const MonteurInventoryCheck = lazy(() => import("./pages/MonteurInventoryCheck"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPerformance = lazy(() => import("./pages/AdminPerformance"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminMontage = lazy(() => import("./pages/AdminMontage"));
const AdminMontageKunden = lazy(() => import("./pages/AdminMontageKunden"));
const AdminMontageKundenDetail = lazy(() => import("./pages/AdminMontageKundenDetail"));
const AdminMontageAuftraege = lazy(() => import("./pages/AdminMontageAuftraege"));
const AdminJobDetail = lazy(() => import("./pages/AdminJobDetail"));
const MonteurMontage = lazy(() => import("./pages/MonteurMontage"));
const MonteurJobDetail = lazy(() => import("./pages/MonteurJobDetail"));
const MonteurPerformance = lazy(() => import("./pages/MonteurPerformance"));
const DownloadPage = lazy(() => import("./pages/DownloadPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <BonusSettingsProvider>
          <InventoryProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/role-select" element={
                    <ProtectedRoute>
                      <RoleSelectPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/vehicles" element={
                    <ProtectedRoute requiredRole="monteur">
                      <MonteurVehicleSelect />
                    </ProtectedRoute>
                  } />
                  <Route path="/inventory/:vehicleId" element={
                    <ProtectedRoute requiredRole="monteur">
                      <MonteurInventoryCheck />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/montage" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminMontage />
                    </ProtectedRoute>
                  }>
                    <Route path="auftraege" element={<AdminMontageAuftraege />} />
                    <Route path="kunden" element={<AdminMontageKunden />} />
                    <Route path="kunden/:id" element={<AdminMontageKundenDetail />} />
                    <Route path="planung" element={<div className="p-8 text-center text-muted-foreground">Planung – Kommt bald</div>} />
                    <Route path="termine" element={<div className="p-8 text-center text-muted-foreground">Termine – Kommt bald</div>} />
                    <Route path="job/:id" element={<AdminJobDetail />} />
                  </Route>
                  <Route path="/admin/performance" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPerformance />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/performance" element={
                    <ProtectedRoute requiredRole="monteur">
                      <MonteurPerformance />
                    </ProtectedRoute>
                  } />
                  <Route path="/montage" element={
                    <ProtectedRoute requiredRole="monteur">
                      <MonteurMontage />
                    </ProtectedRoute>
                  } />
                  <Route path="/montage/job/:id" element={
                    <ProtectedRoute requiredRole="monteur">
                      <MonteurJobDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/downloads" element={
                    <ProtectedRoute>
                      <DownloadPage />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </InventoryProvider>
          </BonusSettingsProvider>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
