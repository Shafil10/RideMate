import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, ListChecks, Clock, UserRound, Car } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import TabBar, { type TabDef } from "../ui/TabBar";
import ChatboxWidget from "../chatbot/ChatboxWidget";

const passengerTabs: TabDef[] = [
  { to: "/passenger", label: "Home", icon: <Home size={20} /> },
  { to: "/passenger/requests", label: "Requests", icon: <ListChecks size={20} /> },
  { to: "/activity", label: "Activity", icon: <Clock size={20} /> },
  { to: "/profile", label: "Profile", icon: <UserRound size={20} /> },
];

const driverTabs: TabDef[] = [
  { to: "/driver", label: "Home", icon: <Home size={20} /> },
  { to: "/driver/rides", label: "My Rides", icon: <Car size={20} /> },
  { to: "/activity", label: "Activity", icon: <Clock size={20} /> },
  { to: "/profile", label: "Profile", icon: <UserRound size={20} /> },
];

export default function TabShell() {
  const { user } = useAuth();
  const location = useLocation();
  const isDriverMode = user?.defaultRole === "driver";

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <TabBar tabs={isDriverMode ? driverTabs : passengerTabs} accent={isDriverMode ? "driver" : "primary"} />
      <ChatboxWidget />
    </div>
  );
}
