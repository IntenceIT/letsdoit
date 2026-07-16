import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Component, ErrorInfo, ReactNode, lazy, Suspense } from "react";
import InstallPrompt from "@/components/InstallPrompt";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load pages - CRITICAL for performance
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const AddTask = lazy(() => import("./pages/AddTask"));
const Profile = lazy(() => import("./pages/Profile"));
const Members = lazy(() => import("./pages/Members"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with shorter cache times
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - reduced from 5 minutes
      gcTime: 1000 * 60 * 2, // 2 minutes - reduced from 10 minutes
      refetchOnWindowFocus: false,
      retry: 1, // Only retry once on failure
    },
  },
});

// Minimal loading component
const PageLoader = () => <LoadingSpinner message="Loading..." submessage="" />;

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, member, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." submessage="" />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user exists but no member data, they might be in the middle of signup
  // Let the routing system handle this case
  if (!member) {
    return <LoadingSpinner message="Setting up your account..." submessage="" />;
  }

  if (member.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (member.status === 'rejected') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, member, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." submessage="" />;
  }

  // If user is authenticated
  if (user) {
    // If no member data yet, they might be in the middle of signup
    // Redirect to pending approval to handle this case
    if (!member) {
      return <Navigate to="/pending-approval" replace />;
    }
    
    // If member exists, check status
    if (member.status === 'approved') {
      return <Navigate to="/dashboard" replace />;
    }
    if (member.status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    if (member.status === 'rejected') {
      // Sign out rejected users automatically
      signOut();
      return <>{children}</>;
    }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-task"
          element={
            <ProtectedRoute>
              <AddTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          }
        />

        {/* Pending Approval Route - accessible to authenticated users */}
        <Route 
          path="/pending-approval" 
          element={
            <Suspense fallback={<PageLoader />}>
              <PendingApproval />
            </Suspense>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <InstallPrompt />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;