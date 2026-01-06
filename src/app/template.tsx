"use client";

import { motion } from "framer-motion";

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // Custom easeOutExpo
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.99,
    filter: "blur(2px)",
    transition: {
      duration: 0.3,
      ease: [0.32, 0, 0.67, 0], // Custom easeIn
    },
  },
};

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
