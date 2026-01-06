"use client";

import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type AdminHeaderProps = {
  activeTab: "session" | "bank";
  setActiveTab: (tab: "session" | "bank") => void;
  onLogout: () => void;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const logoVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.95 },
};

export function AdminHeader({ activeTab, setActiveTab, onLogout }: AdminHeaderProps) {
  return (
    <motion.header
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <motion.div
          variants={logoVariants}
          whileHover="hover"
          whileTap="tap"
          className="relative w-12 h-12 cursor-pointer"
        >
          <NextImage src="/logo1.png" alt="Logo" fill className="object-contain" priority />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="text-xl font-bold text-slate-900">Selamat Datang</h1>
          <p className="text-sm text-slate-500">Kelola kuis dan bank soal</p>
        </motion.div>
      </motion.div>
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="bg-slate-100 p-1 rounded-full flex gap-1 relative isolate">
          {(["session", "bank"] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: activeTab === tab ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                    mass: 1,
                  }}
                />
              )}
              {tab === "session" ? "Sesi Aktif" : "Bank Soal"}
            </motion.button>
          ))}
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-full">
            Logout
          </Button>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}

