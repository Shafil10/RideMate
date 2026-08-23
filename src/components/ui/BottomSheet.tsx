import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed left-0 right-0 bottom-0 z-50 bg-card rounded-t-[28px] max-h-[85vh] overflow-y-auto shadow-[0_-8px_30px_rgba(15,23,42,0.15)]"
          >
            <div className="sticky top-0 bg-card rounded-t-[28px] pt-3 pb-2 px-5 flex items-center justify-between border-b border-border/60">
              <span className="mx-auto absolute left-1/2 -translate-x-1/2 top-2 h-1.5 w-10 rounded-full bg-border" />
              <h3 className="font-display font-bold text-base text-text mt-3">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="mt-3 h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-text-muted"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
