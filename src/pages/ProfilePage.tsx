import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, Card, Button } from "../components/ui";
import { useToast } from "../components/ui";

export default function ProfilePage() {
  const { user, logout, setDefaultRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (!user) return null;

  async function switchRole(role: "passenger" | "driver") {
    if (role === user!.defaultRole) return;
    try {
      await setDefaultRole(role);
      showToast(`Switched to ${role} mode`);
      navigate(role === "driver" ? "/driver" : "/passenger");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't switch roles — try again.", "error");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mb-8">
        <Avatar name={user.name} size="lg" />
        <h1 className="font-display text-xl font-extrabold text-text mt-3">{user.name}</h1>
        <p className="text-text-muted text-sm">{user.email}</p>
        <p className="text-text-muted text-xs mt-0.5">{user.university}</p>
      </motion.div>

      <Card padding="md" className="mb-4">
        <h2 className="font-display font-bold text-sm text-text mb-3">Your mode</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => switchRole("passenger")}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 ${
              user.defaultRole === "passenger" ? "border-primary bg-primary-light" : "border-border"
            }`}
          >
            <GraduationCap size={22} className={user.defaultRole === "passenger" ? "text-primary" : "text-text-muted"} />
            <span className="text-xs font-semibold text-text">Passenger</span>
          </button>
          <button
            onClick={() => switchRole("driver")}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 ${
              user.defaultRole === "driver" ? "border-driver bg-driver-light" : "border-border"
            }`}
          >
            <Car size={22} className={user.defaultRole === "driver" ? "text-driver" : "text-text-muted"} />
            <span className="text-xs font-semibold text-text">Driver</span>
          </button>
        </div>
      </Card>

      <Button variant="outline" fullWidth icon={<LogOut size={18} />} onClick={logout} className="mt-2">
        Log out
      </Button>
    </div>
  );
}
