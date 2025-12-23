import { motion } from 'framer-motion';
import { Sparkles, Star, Zap } from 'lucide-react';

const words = [
  'CONFIDENCE',
  '•',
  'FLUENCY',
  '•',
  'SUCCESS',
  '•',
  'GROWTH',
  '•',
  'EXCELLENCE',
  '•',
  'COMMUNICATION',
  '•',
  'CONFIDENCE',
  '•',
  'FLUENCY',
  '•',
  'SUCCESS',
  '•',
  'GROWTH',
  '•',
  'EXCELLENCE',
  '•',
  'COMMUNICATION',
  '•',
];

// Floating decorative elements for marquee
const floatingElements = [
  { Icon: Sparkles, x: '3%', y: '20%', size: 24, delay: 0, duration: 3, color: 'text-primary-foreground/30' },
  { Icon: Star, x: '96%', y: '25%', size: 20, delay: 0.5, duration: 3.5, color: 'text-primary-foreground/25' },
  { Icon: Zap, x: '50%', y: '15%', size: 22, delay: 1, duration: 4, color: 'text-primary-foreground/20' },
];

export default function MarqueeSection() {
  return (
    <section className="py-8 bg-primary overflow-hidden relative">
      {/* Floating 3D Elements */}
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className={`absolute ${element.color} pointer-events-none z-10`}
          style={{ left: element.x, top: element.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { duration: element.duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: element.duration, repeat: Infinity, ease: "easeInOut", delay: element.delay },
            scale: { duration: 0.5, delay: element.delay }
          }}
        >
          <element.Icon size={element.size} strokeWidth={1.5} />
        </motion.div>
      ))}

      <div className="relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex whitespace-nowrap"
        >
          {words.map((word, index) => (
            <span
              key={index}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground/90 mx-4 md:mx-6"
            >
              {word}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
