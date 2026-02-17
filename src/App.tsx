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

// Retry wrapper for dynamic imports to handle Vite HMR/cache issues
function lazyRetry(factory: () => Promise<any>, retries = 2) {
  return lazy(() =>
    factory().catch((err: any) => {
      if (retries > 0) {
        return new Promise<any>((resolve) => setTimeout(resolve, 500)).then(() =>
          lazyRetry(factory, retries - 1) as any
        );
      }
      // Force reload on persistent failure
      window.location.reload();
      throw err;
    })
  );
}

const RoleSelectPage = lazyRetry(() => import("./pages/RoleSelectPage"));
const MonteurVehicleSelect = lazyRetry(() => import("./pages/MonteurVehicleSelect"));
const MonteurInventoryCheck = lazyRetry(() => import("./pages/MonteurInventoryCheck"));
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard"));
const AdminPerformance = lazyRetry(() => import("./pages/AdminPerformance"));
const AdminSettings = lazyRetry(() => import("./pages/AdminSettings"));
const AdminMontage = lazyRetry(() => import("./pages/AdminMontage"));
const AdminMontageKunden = lazyRetry(() => import("./pages/AdminMontageKunden"));
const AdminMontageKundenDetail = lazyRetry(() => import("./pages/AdminMontageKundenDetail"));
const AdminMontageAuftraege = lazyRetry(() => import("./pages/AdminMontageAuftraege"));
const AdminMontageTermine = lazyRetry(() => import("./pages/AdminMontageTermine"));
const AdminMontagePlanung = lazyRetry(() => import("./pages/AdminMontagePlanung"));
const AdminJobDetail = lazyRetry(() => import("./pages/AdminJobDetail"));
const MonteurMontage = lazyRetry(() => import("./pages/MonteurMontage"));
const MonteurJobDetail = lazyRetry(() => import("./pages/MonteurJobDetail"));
const MonteurPerformance = lazyRetry(() => import("./pages/MonteurPerformance"));
const DownloadPage = lazyRetry(() => import("./pages/DownloadPage"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const SourceExport = lazyRetry(() => import("./pages/SourceExport"));

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
                    <Route path="planung" element={<AdminMontagePlanung />} />
                    <Route path="termine" element={<AdminMontageTermine />} />
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
                  <Route path="/source-export" element={<SourceExport />} />
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
