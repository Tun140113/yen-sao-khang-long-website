import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PremiumLoader({ onComplete }) {
  const [stage, setStage] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Stage 1: Nest Reveal (0-1.5s)
    const timer1 = setTimeout(() => setStage(2), 1500);
    
    // Stage 2: Flying Swiftlets (1.5-2.5s)
    const timer2 = setTimeout(() => setStage(3), 2500);
    
    // Stage 3: Golden Drop (2.5-3.5s)
    const timer3 = setTimeout(() => setStage(4), 3500);
    
    // Complete (3.5s minimum)
    const timer4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 80);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#FFFBF5] via-[#FFF8E8] to-[#FFF5E0] flex items-center justify-center z-50 overflow-hidden">
      {/* CGI Background with volumetric lighting */}
      <div className="absolute inset-0">
        {/* Volumetric light rays */}
        <div className="absolute inset-0 opacity-20" style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255, 215, 0, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(212, 175, 55, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(255, 223, 128, 0.15) 0%, transparent 70%)
          `
        }}></div>
        
        {/* Subtle gradient mesh */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212, 175, 55, 0.1) 2px, rgba(212, 175, 55, 0.1) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(212, 175, 55, 0.1) 2px, rgba(212, 175, 55, 0.1) 4px)
          `
        }}></div>
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Flying Swiftlets - Stage 2 with CGI trails */}
        <AnimatePresence>
          {stage >= 2 && (
            <>
              {[...Array(6)].map((_, i) => {
                const angle = (i * Math.PI * 2) / 6;
                const radius = 180;
                return (
                  <motion.div
                    key={`bird-${i}`}
                    className="absolute"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0.8, 0],
                      x: [
                        Math.cos(angle) * radius,
                        Math.cos(angle + Math.PI / 3) * radius,
                        Math.cos(angle + Math.PI * 2 / 3) * radius,
                        Math.cos(angle + Math.PI) * radius
                      ],
                      y: [
                        Math.sin(angle) * radius + 200,
                        Math.sin(angle + Math.PI / 3) * radius + 200,
                        Math.sin(angle + Math.PI * 2 / 3) * radius + 200,
                        Math.sin(angle + Math.PI) * radius + 200
                      ],
                      rotate: [0, 120, 240, 360],
                      scale: [0.8, 1, 1, 0.9]
                    }}
                    transition={{
                      duration: 2.5,
                      delay: i * 0.15,
                      ease: [0.45, 0.05, 0.55, 0.95]
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                      marginLeft: '-16px',
                      marginTop: '-16px',
                      filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.4))'
                    }}
                  >
                    {/* CGI Swiftlet with gradient */}
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <defs>
                        <linearGradient id={`birdGradient-${i}`} x1="8" y1="4" x2="24" y2="28">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                          <stop offset="100%" stopColor="#B8941E" stopOpacity="0.8" />
                        </linearGradient>
                        <filter id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <path
                        d="M16 4C16 4 10 9 10 14C10 17 11.5 18.5 13 20C11.5 21.5 10 23 10 26C10 29 13 32 16 32C19 32 22 29 22 26C22 23 20.5 21.5 19 20C20.5 18.5 22 17 22 14C22 9 16 4 16 4Z"
                        fill={`url(#birdGradient-${i})`}
                        filter={`url(#glow-${i})`}
                      />
                    </svg>
                    
                    {/* Volumetric golden trail */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-2 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.6) 0%, rgba(212, 175, 55, 0.3) 50%, transparent 100%)',
                        filter: 'blur(4px)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                      }}
                      animate={{
                        opacity: [0, 0.8, 0.6, 0],
                        scaleX: [0.5, 1, 0.8, 0.3]
                      }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2 }}
                    />
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Central Nest/Logo Container with CGI effects */}
        <div className="relative flex flex-col items-center">
          {/* Stage 1: Nest Reveal with realistic lighting */}
          <motion.div
            className="relative w-56 h-56 mb-8"
            initial={{ filter: "blur(30px)", scale: 0.7, opacity: 0 }}
            animate={{
              filter: stage >= 1 ? "blur(0px)" : "blur(30px)",
              scale: stage >= 1 ? 1 : 0.7,
              opacity: stage >= 1 ? 1 : 0
            }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* CGI Nest illustration with layered effects */}
            <div 
              className="w-full h-full rounded-full flex items-center justify-center relative"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 248, 220, 0.9) 0%, rgba(255, 243, 205, 0.7) 40%, rgba(245, 230, 211, 0.5) 100%)',
                boxShadow: `
                  inset 0 -20px 40px rgba(212, 175, 55, 0.15),
                  inset 0 20px 40px rgba(255, 255, 255, 0.3),
                  0 20px 60px rgba(212, 175, 55, 0.25),
                  0 0 80px rgba(255, 215, 0, 0.15)
                `,
                border: '2px solid rgba(212, 175, 55, 0.2)'
              }}
            >
              {/* Inner glow ring */}
              <div 
                className="absolute inset-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                  filter: 'blur(10px)'
                }}
              />
              
              <div className="relative z-10">
                {/* Center Logo with CGI effect */}
                <motion.div
                  className="w-32 h-32 relative flex items-center justify-center"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(212, 175, 55, 0.4))',
                  }}
                  animate={{
                    filter: [
                      'drop-shadow(0 4px 8px rgba(212, 175, 55, 0.4))',
                      'drop-shadow(0 6px 12px rgba(212, 175, 55, 0.6))',
                      'drop-shadow(0 4px 8px rgba(212, 175, 55, 0.4))'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
                    alt="Khang Long Logo"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                
                {/* Realistic golden particles with volumetric glow */}
                {stage >= 1 && [...Array(20)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 3 + 2 + 'px',
                      height: Math.random() * 3 + 2 + 'px',
                      background: 'radial-gradient(circle, rgba(255, 215, 0, 1) 0%, rgba(212, 175, 55, 0.8) 70%, transparent 100%)',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4)',
                      left: `${Math.random() * 120 - 10}%`,
                      bottom: '-10px'
                    }}
                    animate={{
                      y: [-20, -100 - Math.random() * 80],
                      x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 60],
                      opacity: [0, 1, 0.8, 0],
                      scale: [0.3, 1, 0.8, 0.2]
                    }}
                    transition={{
                      duration: 2.5 + Math.random() * 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                  />
                ))}
              </div>
            </div>

            {/* CGI Circular progress ring with volumetric glow */}
            <svg className="absolute inset-0 -rotate-90" width="224" height="224">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                  <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
                </linearGradient>
                <filter id="progressGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="112"
                cy="112"
                r="108"
                fill="none"
                stroke="rgba(212, 175, 55, 0.15)"
                strokeWidth="2"
              />
              <motion.circle
                cx="112"
                cy="112"
                r="108"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 108}
                initial={{ strokeDashoffset: 2 * Math.PI * 108 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 108 * (1 - progress / 100) }}
                transition={{ duration: 0.1 }}
                stroke="url(#progressGradient)"
                filter="url(#progressGlow)"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))'
                }}
              />
            </svg>
          </motion.div>

          {/* Stage 3: Realistic Golden Drop with physics */}
          <AnimatePresence>
            {stage >= 3 && (
              <motion.div
                className="absolute top-28"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Golden drop with 3D effect */}
                <motion.div
                  className="relative w-6 h-6 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #FFD700 0%, #D4AF37 50%, #B8941E 100%)',
                    boxShadow: `
                      0 4px 8px rgba(212, 175, 55, 0.4),
                      inset 0 -2px 4px rgba(0, 0, 0, 0.2),
                      inset 0 2px 4px rgba(255, 255, 255, 0.6),
                      0 0 20px rgba(255, 215, 0, 0.5)
                    `
                  }}
                  animate={{
                    y: [0, 120],
                    scale: [1, 1.1, 0.9, 0.7],
                    opacity: [1, 1, 0.9, 0]
                  }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.4, 0, 0.6, 1],
                    times: [0, 0.3, 0.7, 1]
                  }}
                >
                  {/* Reflection highlight */}
                  <div 
                    className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-60"
                    style={{ filter: 'blur(1px)' }}
                  />
                </motion.div>
                
                {/* Impact shimmer with volumetric effect */}
                <motion.div
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 3, 4],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 1, delay: 1.2 }}
                >
                  <div 
                    className="w-24 h-24 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(212, 175, 55, 0.3) 40%, transparent 70%)',
                      filter: 'blur(12px)',
                      boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)'
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Brand Name with CGI text effect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 30 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h1 
              className="text-4xl font-bold mb-2 tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #B8941E 0%, #D4AF37 50%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.3))'
              }}
            >
              Khang Long
            </h1>
            <p 
              className="text-amber-600/90 text-sm font-medium tracking-wider"
              style={{
                textShadow: '0 1px 3px rgba(212, 175, 55, 0.2)'
              }}
            >
              Yến Sào Cao Cấp
            </p>
          </motion.div>

          {/* Loading indicator with CGI glow */}
          <motion.div
            className="mt-8"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, #FFD700 0%, #D4AF37 100%)',
                      boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.2,
                      delay: i * 0.25,
                      repeat: Infinity
                    }}
                  />
                ))}
              </div>
              <span 
                className="text-amber-700/80 text-sm font-semibold"
                style={{ textShadow: '0 1px 2px rgba(212, 175, 55, 0.2)' }}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </motion.div>

          {/* Ambient sparkles with volumetric glow */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute rounded-full"
              style={{
                width: '2px',
                height: '2px',
                background: 'radial-gradient(circle, rgba(255, 215, 0, 1) 0%, transparent 100%)',
                boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`
              }}
              animate={{
                scale: [0, 2, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.35,
                repeat: Infinity
              }}
            />
          ))}
        </div>
      </div>

      {/* Stage 4: Smooth fade to white */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 4 ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </div>
  );
}