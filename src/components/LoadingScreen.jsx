import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GoldenDropLoader from "./GoldenDropLoader";

export default function LoadingScreen({ message = "Đang tải...", useCustomLoader = false }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (useCustomLoader) {
    return <GoldenDropLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-[#F5E6D3]/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center bg-white/70 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/30 max-w-md w-full mx-4 relative z-10"
      >
        {/* Logo or Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" 
            alt="Khang Long Logo"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-2 drop-shadow-sm">
          Yến Sào Khang Long
        </h2>
        <p className="text-[#6B5742] mb-8">{message}</p>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-white/50 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-white/30">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#D4AF37] via-[#F5E6D3] to-[#D4AF37] rounded-full shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </motion.div>
        </div>
        
        {/* Progress Percentage */}
        <p className="text-sm text-[#6B5742] mt-4 font-semibold">
          {Math.round(progress)}%
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-br from-[#D4AF37] to-[#B8941E] rounded-full shadow-lg"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}