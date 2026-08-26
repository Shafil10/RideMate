import { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui";
import { setAppStatusBar } from "./lib/statusBar";
import TabShell from "./components/layout/TabShell";
import RequireAuth from "./components/layout/RequireAuth";
import RideRedirect from "./components/layout/RideRedirect";
import SplashScreen from "./components/layout/SplashScreen";
import LoginPage from "./pages/LoginPage";

// Lazy-loaded: none of these are needed for the initial paint (auth screen),
// only after login/navigation — keeps the entry bundle small.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PassengerHome = lazy(() => import("./pages/passenger/PassengerHome"));
const MyRequests = lazy(() => import("./pages/passenger/MyRequests"));
const DriverHome = lazy(() => import("./pages/driver/DriverHome"));
const MyOfferedRides = lazy(() => import("./pages/driver/MyOfferedRides"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function RouteFallback() {
  return <div className="min-h-screen bg-background" />;
}

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
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
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
