import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";
import { useOfflineStore } from "./stores/useOfflineStore";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();
  const { initListeners } = useOfflineStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    const cleanupOffline = initListeners();
    return () => cleanupOffline();
  }, [initListeners]);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }

    return () => disconnectSocket();
  }, [accessToken]);

  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route
            path="/"
            element={<LandingPage />}
          />
          <Route
            path="/signin"
            element={<SignInPage />}
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />

          {/* protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/chat"
              element={<ChatAppPage />}
            />
          </Route>

          {/* fallback route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;