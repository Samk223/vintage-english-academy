import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { GraduationCap, Target, Heart, Lightbulb } from 'lucide-react';

const features = [
  {
    icon: GraduationCap,
    title: 'Expert Guidance',
    description: 'Learn from a seasoned educator with over a decade of experience in transforming lives through language.',
  },
  {
    icon: Target,
    title: 'Goal-Oriented',
    description: 'Whether it\'s acing interviews, competitive exams, or daily communication — we tailor our approach to your goals.',
  },
  {
    icon: Heart,
    title: 'Personalized Care',
    description: 'Small batch sizes ensure individual attention and customized learning paths for maximum growth.',
  },
  {
    icon: Lightbulb,
    title: 'Innovative Methods',
    description: 'Interactive sessions, real-world practice, and modern techniques make learning engaging and effective.',
  },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Control video playback based on scroll
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const unsubscribe = scrollYProgress.on("change", (progress) => {
      if (video.duration) {
        // Map scroll progress to video time
        video.currentTime = progress * video.duration;
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  // Parallax transforms for various elements
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="py-24 md:py-32 bg-secondary/30 relative overflow-hidden"
    >
      {/* Background decoration with parallax */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" 
      />
      
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Video */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative max-w-lg mx-auto">
              {/* Video container */}
              <div className="relative rounded-lg overflow-hidden shadow-card">
                <video
                  ref={videoRef}
                  src="/videos/about-video.mp4"
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-auto"
                />
              </div>
              
              {/* Quote below video */}
              <div className="mt-6 text-center">
                <p className="font-display text-xl italic text-primary">
                  "Every student has a voice. I help them find it."
                </p>
              </div>

              {/* Online & Offline badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-4 flex justify-center"
              >
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg font-semibold text-sm">
                  Online & Offline
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content with parallax */}
          <motion.div
            style={{ y: contentY }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">About Us</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
              Your Journey to
              <span className="block text-primary">Fluent English</span>
              Starts Here
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Based in the heart of Mumbai, our academy is dedicated to transforming the way you communicate. 
              We believe everyone deserves the confidence to express themselves clearly and effectively in English.
            </p>

            <p className="text-muted-foreground mb-10 leading-relaxed">
              From young students preparing for their future to professionals climbing the corporate ladder, 
              from teachers seeking to enhance their skills to competitive exam aspirants — our doors are 
              open to all who wish to master the art of spoken English.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
