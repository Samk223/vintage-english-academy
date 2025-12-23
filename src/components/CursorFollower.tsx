import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CursorFollower() {
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth spring animation for following
  const springConfig = { damping: 20, stiffness: 120, mass: 0.8 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY, isVisible]);

  // Don't show on touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (isTouchDevice) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-50 hidden md:block"
      style={{
        x,
        y,
        translateX: 25,
        translateY: 25,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0,
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.4, type: "spring" },
      }}
    >
      {/* Cute floating bee character */}
      <motion.div
        className="relative"
        animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Soft glow */}
        <div className="absolute inset-0 bg-amber-300/40 blur-xl rounded-full scale-150" />
        
        {/* Bee body */}
        <div className="relative w-10 h-8 bg-gradient-to-br from-amber-300 to-amber-400 rounded-full shadow-lg border-2 border-amber-500/50">
          {/* Stripes */}
          <div className="absolute top-1/2 left-1 right-1 -translate-y-1/2 space-y-1">
            <div className="h-1 bg-amber-900/70 rounded-full" />
            <div className="h-1 bg-amber-900/70 rounded-full" />
          </div>
          
          {/* Face */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full border border-amber-400">
            {/* Eyes */}
            <motion.div 
              className="absolute top-1 left-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.div 
              className="absolute top-1 right-0.5 w-1.5 h-1.5 bg-amber-900 rounded-full"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            {/* Smile */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 border-b-2 border-amber-800 rounded-full" />
            {/* Blush */}
            <div className="absolute bottom-1.5 -left-0.5 w-1 h-0.5 bg-pink-300/60 rounded-full" />
            <div className="absolute bottom-1.5 -right-0.5 w-1 h-0.5 bg-pink-300/60 rounded-full" />
          </div>
          
          {/* Stinger */}
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-1 bg-amber-900/80 rounded-r-full" />
        </div>
        
        {/* Wings */}
        <motion.div
          className="absolute -top-2 left-3 w-4 h-5 bg-white/70 rounded-full border border-white/50 shadow-sm"
          style={{ transformOrigin: "bottom center" }}
          animate={{ rotate: [-20, 20, -20], scaleY: [1, 0.9, 1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
        <motion.div
          className="absolute -top-1 left-5 w-3 h-4 bg-white/60 rounded-full border border-white/40 shadow-sm"
          style={{ transformOrigin: "bottom center" }}
          animate={{ rotate: [15, -15, 15], scaleY: [1, 0.9, 1] }}
          transition={{ duration: 0.1, repeat: Infinity, delay: 0.05 }}
        />

        {/* Sparkle trail */}
        <motion.div
          className="absolute -right-3 top-0 w-1.5 h-1.5 bg-amber-200 rounded-full"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            x: [0, 5, 10]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.div
          className="absolute -right-2 bottom-1 w-1 h-1 bg-amber-300 rounded-full"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            x: [0, 8, 16]
          }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}