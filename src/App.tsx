import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { POSProvider, usePOS } from "@/contexts/POSContext";
import { AppLayout } from "@/components/Layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Ventas from "./pages/Ventas";
import CuentasCorrientes from "./pages/CuentasCorrientes";
import Devoluciones from "./pages/Devoluciones";
import Caja from "./pages/Caja";
import RegistroVentas from "./pages/RegistroVentas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { currentUser, authInitialized } = usePOS();

  if (!authInitialized) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser } = usePOS();

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Stock />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ventas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Ventas />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cuentas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CuentasCorrientes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/devoluciones"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Devoluciones />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/caja"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <Caja />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/registro-ventas"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <RegistroVentas />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <POSProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </POSProvider>
  </QueryClientProvider>
);

export default App;
