import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  busy?: boolean;
};

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 40,
    rotateX: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      delay: 0.1,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const buttonContainerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.25,
      staggerChildren: 0.05,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  busy = false,
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            style={{ perspective: 1000 }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-4 text-red-500 shadow-lg shadow-red-100"
                >
                  <motion.svg
                    animate={{
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <motion.line
                      animate={{ y1: [11, 13, 11], y2: [17, 15, 17] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      x1="10"
                      y1="11"
                      x2="10"
                      y2="17"
                    />
                    <motion.line
                      animate={{ y1: [11, 13, 11], y2: [17, 15, 17] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      x1="14"
                      y1="11"
                      x2="14"
                      y2="17"
                    />
                  </motion.svg>
                </motion.div>

                <motion.h3
                  custom={0.15}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-lg font-bold text-slate-900 mb-2"
                >
                  {title}
                </motion.h3>
                <motion.p
                  custom={0.2}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-sm text-slate-500 mb-6"
                >
                  {description}
                </motion.p>

                <motion.div
                  variants={buttonContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex gap-3 w-full"
                >
                  <motion.div variants={buttonVariants} className="flex-1">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={onClose}
                        disabled={busy}
                      >
                        Batal
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div variants={buttonVariants} className="flex-1">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={busy ? { scale: [1, 1.02, 1] } : {}}
                      transition={busy ? { duration: 1, repeat: Infinity } : {}}
                    >
                      <Button
                        variant="destructive"
                        className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
                        onClick={onConfirm}
                        disabled={busy}
                      >
                        <AnimatePresence mode="wait">
                          {busy ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="flex items-center gap-2"
                            >
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              Menghapus...
                            </motion.span>
                          ) : (
                            <motion.span
                              key="text"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                            >
                              Ya, Hapus
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

