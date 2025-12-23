import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BookOpen, Pencil } from 'lucide-react';

export default function CursorFollower() {
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth spring animation for following
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
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
        translateX: 20,
        translateY: 20,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0,
        rotate: [0, 5, -5, 0]
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      {/* Floating book with glow effect */}
      <div className="relative">
        {/* Glow background */}
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-150" />
        
        {/* Main element container */}
        <motion.div
          className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg border border-primary-foreground/20"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <BookOpen className="w-6 h-6 text-primary-foreground" strokeWidth={1.5} />
        </motion.div>

        {/* Orbiting pencil */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "150% 150%" }}
        >
          <div className="bg-accent p-1.5 rounded-lg shadow-md">
            <Pencil className="w-3 h-3 text-accent-foreground" strokeWidth={2} />
          </div>
        </motion.div>

        {/* Sparkle effects */}
        <motion.div
          className="absolute -top-2 -left-2 w-2 h-2 bg-accent rounded-full"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="absolute -bottom-1 -right-3 w-1.5 h-1.5 bg-primary-foreground rounded-full"
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
