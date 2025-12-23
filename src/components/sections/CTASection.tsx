import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, CheckCircle, Target, Rocket, Star, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  'Personalized learning path',
  'Flexible scheduling',
  'Expert Mumbai-based coach',
  'Online & offline options',
];

// Floating decorative elements
const floatingElements = [
  { Icon: Target, x: '5%', y: '20%', size: 40, delay: 0, duration: 4.5, color: 'text-primary-foreground/20' },
  { Icon: Rocket, x: '92%', y: '25%', size: 36, delay: 0.6, duration: 4, color: 'text-primary-foreground/25' },
  { Icon: Star, x: '8%', y: '70%', size: 28, delay: 1.2, duration: 5, color: 'text-primary-foreground/15' },
  { Icon: Medal, x: '88%', y: '65%', size: 32, delay: 1.8, duration: 4.2, color: 'text-primary-foreground/20' },
  { Icon: Star, x: '15%', y: '45%', size: 20, delay: 2.2, duration: 3.5, color: 'text-primary-foreground/15' },
];

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary to-vintage-navy relative overflow-hidden">
      {/* Floating 3D Elements */}
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className={`absolute ${element.color} pointer-events-none z-0`}
          style={{ left: element.x, top: element.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: 1,
            y: [0, -15, 0],
            rotate: [0, 8, -8, 0]
          }}
          transition={{
            opacity: { duration: element.duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: element.duration, repeat: Infinity, ease: "easeInOut", delay: element.delay },
            rotate: { duration: element.duration * 1.5, repeat: Infinity, ease: "easeInOut", delay: element.delay },
            scale: { duration: 0.5, delay: element.delay }
          }}
        >
          <element.Icon size={element.size} strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Ready to Transform
            <span className="block font-display italic font-medium">Your English?</span>
          </h2>

          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join hundreds of successful students who have mastered spoken English with us. 
            Your journey to confident communication starts here.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-full text-primary-foreground text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {benefit}
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="xl" variant="gold" asChild>
              <a href="#contact">
                Book Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <a href="tel:+919876543210">Call Now: +91 98765 43210</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
