import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui";
import { setAppStatusBar } from "./lib/statusBar";
import TabShell from "./components/layout/TabShell";
import RequireAuth from "./components/layout/RequireAuth";
import RideRedirect from "./components/layout/RideRedirect";
import SplashScreen from "./components/layout/SplashScreen";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PassengerHome from "./pages/passenger/PassengerHome";
import MyRequests from "./pages/passenger/MyRequests";
import DriverHome from "./pages/driver/DriverHome";
import MyOfferedRides from "./pages/driver/MyOfferedRides";
import ActivityPage from "./pages/ActivityPage";
import ProfilePage from "./pages/ProfilePage";

function AppRoutes() {
  const { hydrated } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const showSplash = !splashDone || !hydrated;

  useEffect(() => {
    if (!showSplash) setAppStatusBar();
  }, [showSplash]);

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen onDone={() => setSplashDone(true)} />}</AnimatePresence>

      {!showSplash && (
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<LandingPage />} />
          <Route path="/rides" element={<RideRedirect />} />

          <Route element={<RequireAuth><TabShell /></RequireAuth>}>
            <Route path="/passenger" element={<PassengerHome />} />
            <Route path="/passenger/requests" element={<MyRequests />} />
            <Route path="/driver" element={<DriverHome />} />
            <Route path="/driver/rides" element={<MyOfferedRides />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
