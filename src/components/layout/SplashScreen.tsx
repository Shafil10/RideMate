import { useEffect } from "react";
import { motion } from "framer-motion";
import { setSplashStatusBar } from "../../lib/statusBar";

interface SplashScreenProps {
  onDone: () => void;
}

// Pure-React overlay — no @capacitor/splash-screen plugin. The native Android
// launch-screen (styles.xml + splash.png) already covers the true cold-boot gap;
// this covers the moment the actual app UI is warming up, with real branding.
export default function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    setSplashStatusBar();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-primary-dark overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={() => {}}
    >
      {/* Soft decorative blobs for a lively, non-flat feel */}
      <motion.div
        className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/10"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-secondary/20"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center shadow-xl mb-5"
      >
        <span className="font-display text-4xl font-extrabold text-primary-dark">R</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="font-display text-3xl font-extrabold text-white tracking-tight"
      >
        RideMate
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="text-white/85 text-sm font-medium mt-2 text-center px-10"
      >
        Travel together. Save together.
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.7, duration: 0.8, ease: "easeInOut" }}
        onAnimationComplete={onDone}
        className="absolute bottom-14 h-1 w-24 rounded-full bg-white/30 origin-left overflow-hidden"
      >
        <motion.div className="h-full w-full bg-white" />
      </motion.div>
    </motion.div>
  );
}
