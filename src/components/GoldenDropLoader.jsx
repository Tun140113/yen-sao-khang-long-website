import React from "react";
import { motion } from "framer-motion";

export default function GoldenDropLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center z-50">
      <div className="relative">
        {/* Cup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-40 h-40"
        >
          {/* Cup rim */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-3 bg-gradient-to-r from-amber-200 to-amber-300 rounded-full"></div>
          
          {/* Cup body */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-28 h-28 bg-gradient-to-br from-amber-100 to-amber-200 rounded-b-full border-2 border-amber-300 shadow-lg">
            {/* Liquid shimmer */}
            <motion.div
              className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-amber-400 to-amber-300 rounded-b-full"
              animate={{ opacity: [0.6, 0.8, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: [-100, 100] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              ></motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Golden drop */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{
            y: [0, 70],
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.8]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeIn"
          }}
        >
          {/* Drop trail */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-gradient-to-b from-amber-400 to-transparent"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          ></motion.div>
        </motion.div>

        {/* Ripple effect */}
        <motion.div
          className="absolute top-20 left-1/2 -translate-x-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 0.5
          }}
        >
          <div className="w-8 h-1 bg-amber-400/50 rounded-full"></div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-amber-900 mb-1">Yến Sào Khang Long</h3>
          <motion.p
            className="text-amber-700"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Đang tải...
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}