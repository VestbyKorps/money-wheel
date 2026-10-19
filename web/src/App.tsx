import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { LoadingBlock } from "./components/ui";
import { LoginPage } from "./pages/LoginPage";
import { SchemesPage } from "./pages/SchemesPage";
import { UsersPage } from "./pages/UsersPage";
import { WheelPage } from "./pages/WheelPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock label="Sjekker innlogging…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<WheelPage />} />
            <Route path="schemes" element={<SchemesPage />} />
            <Route path="admin/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
