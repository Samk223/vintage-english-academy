import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CursorFollower() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Faster spring for cursor-like responsiveness
  const springConfig = { damping: 30, stiffness: 400, mass: 0.3 };
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

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    // Hide default cursor globally
    document.body.style.cursor = 'none';
    document.querySelectorAll('a, button, [role="button"], input, textarea, select').forEach(el => {
      (el as HTMLElement).style.cursor = 'none';
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.style.cursor = 'auto';
    };
  }, [cursorX, cursorY, isVisible]);

  // Don't show on touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Global cursor hide style */}
      <style>{`
        *, *::before, *::after {
          cursor: none !important;
        }
      `}</style>
      
      <motion.div
        className="fixed pointer-events-none z-[9999] hidden md:block"
        style={{
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          scale: isVisible ? (isClicking ? 0.85 : 1) : 0,
        }}
        transition={{
          opacity: { duration: 0.15 },
          scale: { duration: 0.15, type: "spring" },
        }}
      >
        {/* Adorable kawaii bee character */}
        <motion.div
          className="relative"
          animate={{ 
            y: isClicking ? 0 : [0, -4, 0], 
            rotate: isClicking ? 0 : [-2, 2, -2] 
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Soft ambient glow */}
          <div className="absolute inset-0 bg-amber-200/50 blur-2xl rounded-full scale-[2]" />
          
          {/* Main bee container */}
          <div className="relative">
            {/* Cute round body */}
            <div className="relative w-12 h-10 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 rounded-[50%] shadow-xl border-2 border-amber-400/60">
              
              {/* Fluffy texture highlight */}
              <div className="absolute top-1 left-2 w-6 h-3 bg-amber-100/60 rounded-full blur-sm" />
              
              {/* Adorable stripes */}
              <div className="absolute top-3 left-2 right-2 space-y-1.5">
                <div className="h-1.5 bg-amber-800/60 rounded-full mx-1" />
                <div className="h-1.5 bg-amber-800/60 rounded-full mx-0.5" />
              </div>
              
              {/* Kawaii face */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full border-2 border-amber-300 shadow-inner">
                
                {/* Big sparkly eyes */}
                <div className="absolute top-1.5 left-1 w-2 h-2.5 bg-amber-950 rounded-full">
                  {/* Eye sparkle */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
                <motion.div 
                  className="absolute top-1.5 right-1 w-2 h-2.5 bg-amber-950 rounded-full"
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3 }}
                >
                  {/* Eye sparkle */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                </motion.div>
                
                {/* Tiny cute nose */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-1 h-0.5 bg-amber-600/50 rounded-full" />
                
                {/* Happy smile */}
                <svg className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-2" viewBox="0 0 12 8">
                  <path 
                    d="M2 2 Q6 7 10 2" 
                    stroke="#92400e" 
                    strokeWidth="1.5" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Rosy cheeks */}
                <div className="absolute bottom-2 -left-0.5 w-1.5 h-1 bg-pink-300/70 rounded-full blur-[1px]" />
                <div className="absolute bottom-2 -right-0.5 w-1.5 h-1 bg-pink-300/70 rounded-full blur-[1px]" />
              </div>
              
              {/* Cute antennae */}
              <div className="absolute -top-3 left-0">
                <div className="w-0.5 h-3 bg-amber-700 rounded-full transform -rotate-12" />
                <motion.div 
                  className="absolute -top-1 -left-0.5 w-2 h-2 bg-amber-500 rounded-full border border-amber-600"
                  animate={{ y: [0, -1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </div>
              <div className="absolute -top-3 left-3">
                <div className="w-0.5 h-3 bg-amber-700 rounded-full transform rotate-12" />
                <motion.div 
                  className="absolute -top-1 -left-0.5 w-2 h-2 bg-amber-500 rounded-full border border-amber-600"
                  animate={{ y: [0, -1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
              </div>
              
              {/* Cute stinger */}
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2">
                <div className="w-2 h-1.5 bg-gradient-to-r from-amber-600 to-amber-800 rounded-r-full" />
              </div>
            </div>
            
            {/* Fluffy translucent wings */}
            <motion.div
              className="absolute -top-3 left-4 w-5 h-7 bg-gradient-to-br from-white/80 to-sky-100/60 rounded-full border border-white/70 shadow-lg backdrop-blur-sm"
              style={{ transformOrigin: "bottom center" }}
              animate={{ rotate: [-15, 15, -15], scaleY: [1, 0.92, 1] }}
              transition={{ duration: 0.08, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-2 left-6 w-4 h-5 bg-gradient-to-br from-white/70 to-sky-50/50 rounded-full border border-white/50 shadow-md backdrop-blur-sm"
              style={{ transformOrigin: "bottom center" }}
              animate={{ rotate: [12, -12, 12], scaleY: [1, 0.92, 1] }}
              transition={{ duration: 0.08, repeat: Infinity, delay: 0.04 }}
            />

            {/* Magic sparkles */}
            <motion.div
              className="absolute -right-2 -top-1 w-1.5 h-1.5 bg-yellow-200 rounded-full shadow-sm shadow-yellow-300"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.3, 1.2, 0.3],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              className="absolute -right-4 top-2 w-1 h-1 bg-amber-200 rounded-full"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.3, 1, 0.3],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}