import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { hapticTap } from "../../lib/haptics";

export interface TabDef {
  to: string;
  label: string;
  icon: ReactNode;
}

interface TabBarProps {
  tabs: TabDef[];
  accent?: "primary" | "driver";
}

export default function TabBar({ tabs, accent = "primary" }: TabBarProps) {
  const accentText = accent === "driver" ? "text-driver" : "text-primary";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onClick={hapticTap}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2.5 text-[11px] font-semibold relative",
                isActive ? accentText : "text-text-muted",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className={clsx("absolute top-0 h-0.5 w-8 rounded-full", accent === "driver" ? "bg-driver" : "bg-primary")}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div animate={{ scale: isActive ? 1.1 : 1 }}>{tab.icon}</motion.div>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
