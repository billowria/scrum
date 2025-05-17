import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FiArrowRight, FiArrowUp, FiCheck, FiAward, FiCalendar, 
  FiBarChart2, FiUsers, FiMessageSquare, FiSmile, FiPackage } from 'react-icons/fi';
import { FaTwitter, FaLinkedin, FaGithub, FaRegLightbulb, 
  FaRegChartBar, FaRegCommentDots, FaRegClock } from 'react-icons/fa';

// Import our new DemoSection
import DemoSection from '../components/landing/DemoSection';

// Animations and styling constants
const SPRING_OPTIONS = { stiffness: 300, damping: 30, bounce: 0.25 };
const ANIMATION_DURATION = 0.7; 

// Define theme colors for the light theme
const COLORS = {
  primary: '#6366F1', // Indigo
  primaryLight: '#EEF2FF',
  primaryDark: '#4338CA',
  secondary: '#EC4899', // Pink
  secondaryLight: '#FCE7F3',
  accent: '#8B5CF6', // Violet
  accentLight: '#F3F4F6',
  success: '#10B981', // Emerald
  successLight: '#ECFDF5',
  warning: '#F59E0B', // Amber
  warningLight: '#FFFBEB',
  info: '#3B82F6', // Blue
  infoLight: '#EFF6FF',
  white: '#FFFFFF',
  light: '#F9FAFB',
  gray: '#9CA3AF',
  dark: '#111827',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textLight: '#6B7280',
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
};

// Gradients
const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
  secondary: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`,
  card: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.light} 100%)`,
  cta: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visibleSection, setVisibleSection] = useState('hero');
  const [scrollY, setScrollY] = useState(0);
  
  // Create refs for each section
  const heroRef = useRef(null);
  const featuresRef = useRef(null); 
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Use Framer Motion's useScroll hook to get scroll progress
  const { scrollYProgress } = useScroll();
  const smoothScrollYProgress = useSpring(scrollYProgress, SPRING_OPTIONS);
  
  // Check for session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  // Handle scroll events to determine which section is visible
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Update visible section based on scroll position
      const sections = [
        { ref: heroRef, id: 'hero' },
        { ref: featuresRef, id: 'features' },
        { ref: howItWorksRef, id: 'how-it-works' },
        { ref: testimonialsRef, id: 'testimonials' },
        { ref: ctaRef, id: 'cta' }
      ];
      
      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          // If the top of the element is in the top half of the viewport
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            setVisibleSection(section.id);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to section
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
        style={{ 
          scaleX: smoothScrollYProgress,
          background: GRADIENTS.primary
        }}
      />
      
      {/* Custom floating dot navigation */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden md:block">
        <div className="flex flex-col items-center gap-4">
          {['hero', 'features', 'how-it-works', 'testimonials', 'cta'].map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection({
                hero: heroRef,
                features: featuresRef,
                'how-it-works': howItWorksRef,
                testimonials: testimonialsRef,
                cta: ctaRef
              }[section])}
              className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${
                visibleSection === section 
                  ? 'bg-primary scale-125 shadow-lg shadow-primary/30' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Scroll to ${section} section`}
            />
          ))}
        </div>
      </div>
      
      {/* Navbar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrollY > 50 
            ? 'py-3 bg-white/95 shadow-lg backdrop-blur-sm' 
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <motion.div 
                className="relative h-10 w-10 rounded-full overflow-hidden"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0" style={{ background: GRADIENTS.primary }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">AP</span>
                </div>
              </motion.div>
              <motion.span 
                className="text-xl font-bold"
                style={{ color: COLORS.primary }}
                whileHover={{ scale: 1.05 }}
              >
                AgilePulse
              </motion.span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <NavLink onClick={() => scrollToSection(featuresRef)}>Features</NavLink>
              <NavLink onClick={() => scrollToSection(howItWorksRef)}>How it Works</NavLink>
              <NavLink onClick={() => scrollToSection(testimonialsRef)}>Testimonials</NavLink>
              {session ? (
                <Link to="/dashboard">
                  <PrimaryButton>
                    Go to Dashboard
                    <FiArrowRight className="ml-2" />
                  </PrimaryButton>
                </Link>
              ) : (
                <Link to="/login">
                  <PrimaryButton>
                    Get Started
                    <FiArrowRight className="ml-2" />
                  </PrimaryButton>
                </Link>
              )}
            </div>
            
            <div className="md:hidden">
              <button 
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        ref={heroRef} 
        className="relative min-h-screen pt-24 pb-16 flex items-center overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient circles */}
          <div className="absolute top-20 right-[10%] w-96 h-96 rounded-full opacity-20" 
            style={{ background: GRADIENTS.primary }}></div>
          <div className="absolute bottom-20 left-[5%] w-72 h-72 rounded-full opacity-10"
            style={{ background: GRADIENTS.secondary }}></div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                <circle id="pattern-circle" cx="20" cy="20" r="1" fill={COLORS.primary}></circle>
              </pattern>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
            </svg>
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <AnimatedText 
                as="h1" 
                text="Elevate Agile Team Performance" 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight"
                style={{ color: COLORS.textPrimary }}
                delay={0.1}
              />
              
              <AnimatedText
                text="Streamline your daily standups, manage leave calendars, and celebrate team achievements with the most intuitive platform for modern agile teams."
                className="text-xl mb-8 md:pr-12"
                style={{ color: COLORS.textSecondary }}
                delay={0.3}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_DURATION, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                {session ? (
                  <Link to="/dashboard" className="block">
                    <HeroButton>
                      Go to Dashboard
                      <FiArrowRight className="ml-2" />
                    </HeroButton>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="block">
                      <HeroButton>
                        Get Started Free
                        <FiArrowRight className="ml-2" />
                      </HeroButton>
                    </Link>
                    <Link to="/login" className="block">
                      <OutlineButton>
                        Sign In
                      </OutlineButton>
                    </Link>
                  </>
                )}
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-center lg:justify-start mt-8 gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: ANIMATION_DURATION, delay: 0.7 }}
              >
                <div className="flex -space-x-2">
                  {['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500'].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center text-white text-xs ring-2 ring-white`}>
                      {['JS', 'TK', 'MR', '+3'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Trusted by <span className="font-medium">2,000+</span> agile teams
                </p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: ANIMATION_DURATION * 1.5, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 -m-6 rounded-2xl bg-gradient-to-tr from-primary-500/20 to-secondary-500/20 blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                  <div className="h-10 bg-gray-100 flex items-center px-4 border-b border-gray-200">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                  <div className="bg-white">
                    <img 
                      src="https://placehold.co/600x400/EEF2FF/4338CA?text=AgilePulse+Dashboard&font=poppins" 
                      alt="AgilePulse Dashboard"
                      className="w-full h-auto" 
                    />
                  </div>
                </div>
                
                {/* Floating notification */}
                <motion.div 
                  className="absolute top-12 -right-10 bg-white rounded-lg p-3 shadow-xl border border-gray-100 w-60"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8, type: 'spring' }}
                >
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full p-2 mr-3">
                      <FiCheck className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Daily Report Complete</h4>
                      <p className="text-xs text-gray-500">Your team's standup is ready to view</p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating badge */}
                <motion.div 
                  className="absolute -bottom-5 -left-10 bg-white rounded-lg p-3 shadow-xl border border-gray-100"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.8, type: 'spring' }}
                >
                  <div className="flex items-center">
                    <div className="bg-amber-100 rounded-full p-2 mr-3">
                      <FiAward className="text-amber-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Achievement Unlocked!</h4>
                      <div className="flex gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          {/* Scroll down indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <button 
              onClick={() => scrollToSection(featuresRef)}
              className="flex flex-col items-center text-gray-400 hover:text-gray-600"
            >
              <span className="text-sm mb-2">Explore Features</span>
              <motion.div 
                animate={{ y: [0, 5, 0] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionTitle
            subtitle="Powerful Features"
            title="Everything you need to supercharge your agile team"
            description="AgilePulse combines all the essential tools to keep your team connected, informed and productive."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            <FeatureCard 
              icon={<FiMessageSquare />}
              iconColor={COLORS.primary}
              iconBg={COLORS.primaryLight}
              title="Daily Standup Reports"
              description="Streamline your daily standup process with structured reports. Record what you've done, what you're working on, and any blockers."
              delay={0.1}
            />
            
            <FeatureCard 
              icon={<FiCalendar />}
              iconColor={COLORS.secondary}
              iconBg={COLORS.secondaryLight}
              title="Leave Calendar"
              description="Manage team availability with a visual calendar for time off. Request, approve, and track leaves all in one place."
              delay={0.2}
            />
            
            <FeatureCard 
              icon={<FiAward />}
              iconColor={COLORS.accent}
              iconBg={COLORS.accentLight}
              title="Achievement Tracking"
              description="Celebrate team wins and milestones. Recognize accomplishments and foster a culture of appreciation and growth."
              delay={0.3}
            />
            
            <FeatureCard 
              icon={<FiUsers />}
              iconColor={COLORS.success}
              iconBg={COLORS.successLight}
              title="Team Management"
              description="Organize and manage your teams with ease. Add members, assign roles, and keep everything in sync with your project needs."
              delay={0.4}
            />
            
            <FeatureCard 
              icon={<FiBarChart2 />}
              iconColor={COLORS.warning}
              iconBg={COLORS.warningLight}
              title="Performance Analytics"
              description="Gain insights with visual reports and metrics. Track team performance trends and identify opportunities for improvement."
              delay={0.5}
            />
            
            <FeatureCard 
              icon={<FiSmile />}
              iconColor={COLORS.info}
              iconBg={COLORS.infoLight}
              title="Team Wellness"
              description="Monitor team health and work-life balance. Prevent burnout with wellness tracking and workload management tools."
              delay={0.6}
            />
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-1/4 right-0 w-1/3 h-1/3 -z-10 opacity-10 blur-3xl" style={{ background: GRADIENTS.primary }}></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 -z-10 opacity-10 blur-3xl" style={{ background: GRADIENTS.secondary }}></div>
      </section>

      {/* Replace the old How It Works section with our new DemoSection */}
      <section ref={howItWorksRef}>
        <DemoSection />
      </section>

      {/* Testimonials */}
      <section 
        ref={testimonialsRef}
        className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionTitle
            subtitle="Testimonials"
            title="What our customers say"
            description="Don't just take our word for it — hear from teams that have transformed their workflows with AgilePulse"
          />
          
          <div className="mt-16">
            <div className="relative h-96 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="absolute top-0 left-0 w-full h-full"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ 
                    opacity: index === activeTestimonial ? 1 : 0,
                    x: index === activeTestimonial ? 0 : 100,
                    scale: index === activeTestimonial ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8 h-full border border-gray-100">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <div className="text-amber-400 flex mb-6">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <blockquote className="text-xl italic text-gray-700 leading-relaxed">"{testimonial.quote}"</blockquote>
                      </div>
                      
                      <div className="mt-auto flex items-center">
                        <div className="mr-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-semibold`} style={{ background: testimonial.color }}>
                            {testimonial.initial}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-sm text-gray-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`mx-2 h-3 w-3 rounded-full ${
                    index === activeTestimonial ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-1/3 right-0 w-1/4 h-1/4 -z-10 opacity-10 blur-3xl rounded-full" style={{ background: GRADIENTS.primary }}></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 -z-10 opacity-10 blur-3xl rounded-full" style={{ background: GRADIENTS.secondary }}></div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="py-20 relative overflow-hidden"
      >
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-300/10 to-secondary-300/10"></div>
          
          {/* Animated shapes */}
          <motion.div 
            className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-500/10 -z-10"
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div 
            className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-secondary-500/10 -z-10"
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, -20, 0],
              y: [0, 15, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
            <div className="text-center">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-6 text-gray-900"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                Ready to transform your team's workflow?
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                Join thousands of teams who use AgilePulse to streamline their standups, manage time off, and celebrate achievements.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                {session ? (
                  <Link to="/dashboard">
                    <HeroButton>
                      Go to Dashboard
                      <FiArrowRight className="ml-2" />
                    </HeroButton>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup">
                      <HeroButton>
                        Start Free Trial
                        <FiArrowRight className="ml-2" />
                      </HeroButton>
                    </Link>
                    <Link to="/login">
                      <OutlineButton>
                        Sign In
                      </OutlineButton>
                    </Link>
                  </>
                )}
              </motion.div>
              
              <motion.div 
                className="mt-8 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <p>No credit card required • 14-day free trial • Cancel anytime</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <div className="absolute inset-0" style={{ background: GRADIENTS.primary }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">AP</span>
                  </div>
                </div>
                <span className="text-xl font-bold" style={{ color: COLORS.primary }}>AgilePulse</span>
              </Link>
              <p className="text-gray-600 mb-4">Transforming team collaboration with streamlined standups, leave management, and achievement tracking.</p>
              <div className="flex space-x-4">
                <SocialLink href="#" icon={<FaTwitter />} />
                <SocialLink href="#" icon={<FaLinkedin />} />
                <SocialLink href="#" icon={<FaGithub />} />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3">
                <FooterLink href="#">Features</FooterLink>
                <FooterLink href="#">Pricing</FooterLink>
                <FooterLink href="#">Integrations</FooterLink>
                <FooterLink href="#">Changelog</FooterLink>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <FooterLink href="#">About Us</FooterLink>
                <FooterLink href="#">Careers</FooterLink>
                <FooterLink href="#">Blog</FooterLink>
                <FooterLink href="#">Contact</FooterLink>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3">
                <FooterLink href="#">Help Center</FooterLink>
                <FooterLink href="#">Documentation</FooterLink>
                <FooterLink href="#">API</FooterLink>
                <FooterLink href="#">Community</FooterLink>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} AgilePulse. All rights reserved.</p>
            <div className="flex space-x-6">
              <FooterLink href="#" className="text-sm">Privacy Policy</FooterLink>
              <FooterLink href="#" className="text-sm">Terms of Service</FooterLink>
              <FooterLink href="#" className="text-sm">Cookies</FooterLink>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {scrollY > 500 && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-50 text-white"
            style={{ background: GRADIENTS.primary }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowUp />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Custom CSS styles for animations and effects */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(79, 148, 252, 0.3);
        }
        
        .typewriter-text {
          overflow: hidden;
          white-space: nowrap;
          border-right: 3px solid #4f94fc;
          animation: typewriter 3s steps(40) forwards, blink-caret 1s step-end infinite;
        }
        
        @keyframes typewriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #4f94fc }
        }
        
        .testimonial-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(79, 148, 252, 0.2);
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0a0e17;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #4f94fc, #a555ff);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a555ff, #4f94fc);
        }
      `}</style>
    </div>
  );
};

// Component for animated text reveal
const AnimatedText = ({ text, as = 'p', className, style, delay = 0 }) => {
  const Tag = as;
  
  return (
    <Tag className={className} style={style}>
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION_DURATION, delay }}
      >
        {text}
      </motion.span>
    </Tag>
  );
};

// Section title component
const SectionTitle = ({ subtitle, title, description }) => {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: ANIMATION_DURATION }}
      >
        <span 
          className="inline-block py-1 px-3 rounded-full text-sm font-medium mb-3"
          style={{ 
            color: COLORS.primary,
            backgroundColor: COLORS.primaryLight
          }}
        >
          {subtitle}
        </span>
      </motion.div>
      
      <motion.h2
        className="text-3xl md:text-4xl font-bold mb-4 text-gray-900"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: ANIMATION_DURATION, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      
      <motion.p
        className="text-lg text-gray-600"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: ANIMATION_DURATION, delay: 0.2 }}
      >
        {description}
      </motion.p>
    </div>
  );
};

// Navigation link component
const NavLink = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-gray-600 hover:text-primary font-medium relative group"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
    </button>
  );
};

// Primary button component
const PrimaryButton = ({ children }) => {
  return (
    <motion.button
      className="px-5 py-2 rounded-full text-white font-medium shadow-md"
      style={{ background: GRADIENTS.primary }}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.3)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center">
        {children}
      </div>
    </motion.button>
  );
};

// Hero button component (larger version of PrimaryButton)
const HeroButton = ({ children }) => {
  return (
    <motion.button
      className="px-8 py-4 rounded-full text-white font-medium shadow-lg text-lg min-w-[200px]"
      style={{ background: GRADIENTS.primary }}
      whileHover={{ scale: 1.05, boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.3)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-center">
        {children}
      </div>
    </motion.button>
  );
};

// Outline button component
const OutlineButton = ({ children }) => {
  return (
    <motion.button
      className="px-8 py-4 rounded-full font-medium border-2 text-lg min-w-[200px]"
      style={{ 
        borderColor: COLORS.primary,
        color: COLORS.primary
      }}
      whileHover={{ scale: 1.05, backgroundColor: COLORS.primaryLight }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-center">
        {children}
      </div>
    </motion.button>
  );
};

// Feature card component
const FeatureCard = ({ icon, iconColor, iconBg, title, description, delay }) => {
  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: ANIMATION_DURATION, delay }}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
        borderColor: iconColor
      }}
    >
      <div 
        className="w-14 h-14 rounded-lg flex items-center justify-center mb-5 text-2xl"
        style={{ 
          backgroundColor: iconBg,
          color: iconColor
        }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

// Social link component
const SocialLink = ({ href, icon }) => {
  return (
    <motion.a
      href={href}
      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-primaryLight"
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
    </motion.a>
  );
};

// Footer link component
const FooterLink = ({ href, children, className = '' }) => {
  return (
    <li>
      <motion.a
        href={href}
        className={`text-gray-600 hover:text-primary ${className}`}
        whileHover={{ x: 3 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.a>
    </li>
  );
};

// Testimonial data
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Engineering Manager, TechNova",
    initial: "S",
    color: COLORS.primary,
    quote: "AgilePulse has completely transformed how our distributed team collaborates. Our daily standups are now efficient and everyone stays in the loop without spending time in endless meetings."
  },
  {
    name: "Michael Chen",
    role: "Product Director, Fusion Labs",
    initial: "M",
    color: COLORS.secondary,
    quote: "The leave management feature has eliminated scheduling conflicts. Approving time off requests is now seamless, and our team calendar is always up to date. Incredible time-saver!"
  },
  {
    name: "Jessica Williams",
    role: "People Operations, GrowthStart",
    initial: "J",
    color: COLORS.accent,
    quote: "We've seen a significant boost in team morale since implementing the achievements tracking. It's great to have a platform to celebrate wins both big and small. Our culture has improved dramatically."
  }
];

export default LandingPage; 