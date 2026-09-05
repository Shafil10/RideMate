import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, GraduationCap, LogOut, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, Card, Button, Input, BottomSheet } from "../components/ui";
import { useToast } from "../components/ui";

export default function ProfilePage() {
  const { user, logout, setDefaultRole, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  function openEdit() {
    setName(user!.name);
    setEmail(user!.email);
    setPhoneNumber(user!.phoneNumber ?? "");
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setSaving(true);
    try {
      await updateProfile({ name, phoneNumber, email });
      showToast("Profile updated.");
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePassword);
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete your account.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-28">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mb-6">
        <Avatar name={user.name} size="lg" />
        <h1 className="font-display text-xl font-extrabold text-text mt-3">{user.name}</h1>
        <p className="text-text-muted text-sm">{user.email}</p>
        <p className="text-text-muted text-xs mt-0.5">
          {user.university}
          {user.phoneNumber && <> · {user.phoneNumber}</>}
        </p>
        <button
          type="button"
          onClick={openEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-3"
        >
          <Pencil size={12} /> Edit profile
        </button>
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

      <button
        type="button"
        onClick={() => {
          setDeleteError(null);
          setDeletePassword("");
          setDeleting(true);
        }}
        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-danger mt-5 w-full"
      >
        <Trash2 size={13} /> Delete account permanently
      </button>

      <BottomSheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          {editError && (
            <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3">{editError}</div>
          )}
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="University email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <p className="text-xs text-text-muted -mt-2">Must still be a valid university email — your school is re-detected from it.</p>
          <Input label="Phone number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          <Button type="submit" loading={saving} fullWidth className="mt-2">
            Save changes
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={deleting} onClose={() => setDeleting(false)} title="Delete account permanently">
        <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            This permanently deletes your account, rides you've offered, bookings, ratings, and messages. This can't be undone.
          </p>
          {deleteError && (
            <div className="bg-danger-light text-danger text-sm font-medium rounded-xl px-4 py-3">{deleteError}</div>
          )}
          <Input
            label="Enter your password to confirm"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" variant="danger" loading={deleteBusy} fullWidth icon={<Trash2 size={16} />}>
            Permanently delete my account
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
