// src/pages/AuthPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiGithub,
  FiCheckCircle,
  FiGrid,
  FiFileText,
  FiUsers,
  FiCheckSquare,
  FiCalendar,
  FiFolder,
  FiMessageCircle,
  FiBarChart2,
  FiZap,
  FiShield,
  FiGlobe,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

/**
 * Premium Auth Page - Split-Screen Design
 * Left: Dark gradient with animated product feature showcase
 * Right: Light glassmorphic login/signup form
 */

// Product features to showcase
const FEATURES = [
  {
    id: 1,
    icon: FiGrid,
    title: "Smart Dashboard",
    description: "Real-time team insights, daily quotes, and task overview at a glance",
    gradient: "from-blue-500 to-indigo-600",
    delay: 0,
  },
  {
    id: 2,
    icon: FiFileText,
    title: "Standup Reports",
    description: "Streamline daily standups with rich text editor and team visibility",
    gradient: "from-purple-500 to-pink-600",
    delay: 0.1,
  },
  {
    id: 3,
    icon: FiUsers,
    title: "Team Management",
    description: "Organize teams, assign roles, and manage permissions effortlessly",
    gradient: "from-emerald-500 to-teal-600",
    delay: 0.2,
  },
  {
    id: 4,
    icon: FiCheckSquare,
    title: "Task Board",
    description: "Kanban-style task management with drag-and-drop simplicity",
    gradient: "from-orange-500 to-red-600",
    delay: 0.3,
  },
  {
    id: 5,
    icon: FiCalendar,
    title: "Leave Calendar",
    description: "Plan and track team availability with visual calendar views",
    gradient: "from-cyan-500 to-blue-600",
    delay: 0.4,
  },
  {
    id: 6,
    icon: FiFolder,
    title: "Projects & Sprints",
    description: "Agile project management with sprint planning and tracking",
    gradient: "from-violet-500 to-purple-600",
    delay: 0.5,
  },
  {
    id: 7,
    icon: FiMessageCircle,
    title: "Team Chat",
    description: "Real-time messaging with direct and group conversations",
    gradient: "from-rose-500 to-pink-600",
    delay: 0.6,
  },
  {
    id: 8,
    icon: FiBarChart2,
    title: "Analytics",
    description: "Performance insights and productivity metrics at your fingertips",
    gradient: "from-amber-500 to-orange-600",
    delay: 0.7,
  },
];

// Animated Feature Card Component
const FeatureCard = ({ feature, index, activeIndex }) => {
  const isActive = index === activeIndex;
  const Icon = feature.icon;

  return (
    <motion.div
      className={`feature-card ${isActive ? 'active' : ''}`}
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isActive ? 1.02 : 1,
        y: isActive ? -5 : 0
      }}
      transition={{
        delay: feature.delay,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{
        scale: 1.05,
        x: 10,
        transition: { duration: 0.2 }
      }}
    >
      {/* Glow effect for active card */}
      {isActive && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-20 blur-xl`}
          layoutId="activeGlow"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Card content */}
      <div className="feature-card-inner">
        <motion.div
          className={`feature-icon bg-gradient-to-br ${feature.gradient}`}
          animate={isActive ? {
            rotate: [0, -10, 10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{
            duration: 0.6,
            repeat: isActive ? Infinity : 0,
            repeatDelay: 2
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>

        <div className="feature-text">
          <h3 className="feature-title">{feature.title}</h3>
          <p className="feature-description">{feature.description}</p>
        </div>

        {/* Animated arrow on hover */}
        <motion.div
          className="feature-arrow"
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
        >
          <FiArrowRight className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Shimmer effect on active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      )}
    </motion.div>
  );
};

// Floating Orb Component
const FloatingOrb = ({ size, color, position, delay }) => (
  <motion.div
    className="floating-orb"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      ...position
    }}
    animate={{
      x: [0, 30, -20, 0],
      y: [0, -40, 20, 0],
      scale: [1, 1.1, 0.9, 1],
    }}
    transition={{
      duration: 20 + delay * 5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }}
  />
);

export default function AuthPage({ mode = "login" }) {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Feature carousel state
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);

  // Predefined avatar URLs
  const AVATAR_URLS = [
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
  ];

  // Confetti animation
  const confettiCanvasRef = useRef(null);
  useEffect(() => {
    let rafId;
    let ctx = null;
    let w = 0;
    let h = 0;
    let pieces = [];

    function initCanvas() {
      const c = confettiCanvasRef.current;
      if (!c) return;
      ctx = c.getContext("2d");
      function resize() {
        w = (c.width = window.innerWidth);
        h = (c.height = window.innerHeight);
      }
      resize();
      window.addEventListener("resize", resize);
    }

    function spawnConfetti() {
      pieces = [];
      const count = 100;
      for (let i = 0; i < count; i++) {
        pieces.push({
          x: Math.random() * w,
          y: Math.random() * -h * 0.5,
          vx: (Math.random() - 0.5) * 8,
          vy: 2 + Math.random() * 8,
          size: 6 + Math.random() * 10,
          color: ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b"][Math.floor(Math.random() * 5)],
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
        });
      }
    }

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (let p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rot += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
      pieces = pieces.filter((p) => p.y < h + 50);
      rafId = requestAnimationFrame(frame);
    }

    initCanvas();
    if (success) {
      spawnConfetti();
      frame();
      setTimeout(() => {
        cancelAnimationFrame(rafId);
      }, 4000);
    }

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [success]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        if (!companyName) {
          throw new Error("Company name is required");
        }

        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data?.user) {
          const randomAvatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
          const { error: profileError } = await supabase.from("users").insert([
            {
              id: data.user.id,
              name,
              email,
              role: 'manager',
              avatar_url: randomAvatarUrl,
            },
          ]);
          if (profileError) throw profileError;

          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert([
              {
                name: companyName,
                slug: slug,
                created_by: data.user.id
              }
            ])
            .select()
            .single();

          if (companyError) throw companyError;

          const { error: updateError } = await supabase
            .from('users')
            .update({ company_id: companyData.id })
            .eq('id', data.user.id);

          if (updateError) throw updateError;
        }
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 2200);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Confetti canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />

      {/* Split Screen Container */}
      <div className="auth-container">

        {/* Animated Background - Full Page */}
        <div className="full-bg">
          <FloatingOrb
            size="500px"
            color="rgba(99, 102, 241, 0.3)"
            position={{ top: '-10%', left: '-5%' }}
            delay={0}
          />
          <FloatingOrb
            size="400px"
            color="rgba(168, 85, 247, 0.25)"
            position={{ bottom: '5%', left: '30%' }}
            delay={2}
          />
          <FloatingOrb
            size="350px"
            color="rgba(236, 72, 153, 0.2)"
            position={{ top: '30%', left: '45%' }}
            delay={4}
          />
          <FloatingOrb
            size="400px"
            color="rgba(99, 102, 241, 0.25)"
            position={{ top: '-5%', right: '10%' }}
            delay={1}
          />
          <FloatingOrb
            size="300px"
            color="rgba(168, 85, 247, 0.3)"
            position={{ bottom: '20%', right: '-5%' }}
            delay={3}
          />

          {/* Grid pattern overlay */}
          <div className="grid-pattern" />
        </div>

        {/* LEFT PANEL - Product Showcase */}
        <motion.div
          className="left-panel"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >

          {/* Content */}
          <div className="left-content">
            {/* Logo & Brand */}
            <motion.div
              className="brand-section"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="logo-mark">
                <motion.div
                  className="logo-inner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="logo-ring" />
                  <div className="logo-ring ring-2" />
                  <div className="logo-center">
                    <FiZap className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </div>

              <div className="brand-text">
                <h1 className="brand-name">
                  {['S', 'Y', 'N', 'C'].map((letter, i) => (
                    <motion.span
                      key={letter}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="brand-letter"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </h1>
                <motion.p
                  className="brand-tagline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Your team's command center
                </motion.p>
              </div>
            </motion.div>

            {/* Value Proposition */}
            <motion.div
              className="value-prop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <h2 className="value-title">
                Everything your team needs,
                <br />
                <span className="gradient-text">in one place.</span>
              </h2>
              <p className="value-description">
                Streamline standups, manage tasks, track leave, and collaborate seamlessly.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              className="features-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {FEATURES.slice(0, 4).map((feature, index) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  activeIndex={activeFeatureIndex % 4}
                />
              ))}
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="trust-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              <div className="trust-badges">
                <div className="trust-badge">
                  <FiShield className="w-4 h-4" />
                  <span>Enterprise Security</span>
                </div>
                <div className="trust-badge">
                  <FiGlobe className="w-4 h-4" />
                  <span>99.9% Uptime</span>
                </div>
                <div className="trust-badge">
                  <FiUsers className="w-4 h-4" />
                  <span>10,000+ Teams</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT PANEL - Auth Form */}
        <motion.div
          className="right-panel"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="form-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                className="form-card"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Form Header */}
                <div className="form-header">
                  <motion.h2
                    className="form-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {mode === "login" ? "Welcome back" : "Create account"}
                  </motion.h2>
                  <motion.p
                    className="form-subtitle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {mode === "login"
                      ? "Sign in to continue to your workspace"
                      : "Start your 14-day free trial"}
                  </motion.p>
                </div>

                {/* Social Buttons */}
                <motion.div
                  className="social-buttons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <button className="social-btn google">
                    <FcGoogle className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </button>
                  <button className="social-btn github">
                    <FiGithub className="w-5 h-5" />
                  </button>
                </motion.div>

                {/* Divider */}
                <motion.div
                  className="divider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span>or continue with email</span>
                </motion.div>

                {/* Success State */}
                {success ? (
                  <motion.div
                    className="success-state"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="success-icon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <FiCheckCircle className="w-12 h-12 text-emerald-500" />
                    </motion.div>
                    <h3>Welcome aboard!</h3>
                    <p>Redirecting to your dashboard...</p>
                  </motion.div>
                ) : (
                  <motion.form
                    onSubmit={handleSubmit}
                    className="auth-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {mode === "signup" && (
                      <>
                        {/* Company Name */}
                        <div className="input-group">
                          <label>Company Name</label>
                          <div className={`input-wrapper ${companyFocused ? 'focused' : ''}`}>
                            <FiUser className="input-icon" />
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              onFocus={() => setCompanyFocused(true)}
                              onBlur={() => setCompanyFocused(false)}
                              placeholder="Acme Inc."
                              required
                            />
                          </div>
                        </div>

                        {/* Full Name */}
                        <div className="input-group">
                          <label>Full Name</label>
                          <div className={`input-wrapper ${nameFocused ? 'focused' : ''}`}>
                            <FiUser className="input-icon" />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              onFocus={() => setNameFocused(true)}
                              onBlur={() => setNameFocused(false)}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Email */}
                    <div className="input-group">
                      <label>Email Address</label>
                      <div className={`input-wrapper ${emailFocused ? 'focused' : ''}`}>
                        <FiMail className="input-icon" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          placeholder="you@company.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="input-group">
                      <label>Password</label>
                      <div className={`input-wrapper ${passwordFocused ? 'focused' : ''}`}>
                        <FiLock className="input-icon" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        className="error-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Form Options */}
                    {mode === "login" && (
                      <div className="form-options">
                        <label className="checkbox-label">
                          <input type="checkbox" />
                          <span>Remember me</span>
                        </label>
                        <Link to="/forgot" className="forgot-link">
                          Forgot password?
                        </Link>
                      </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="submit-btn"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <motion.div
                          className="spinner"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </motion.div>
                      ) : (
                        <>
                          <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                          <FiArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}

                {/* Form Footer */}
                <motion.div
                  className="form-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {mode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <Link to="/signup" className="switch-link">Sign up free</Link>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link to="/login" className="switch-link">Sign in</Link>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <style>{`
        /* Base */
        .auth-page {
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        .confetti-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
        }

        /* Split Container */
        .auth-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
          position: relative;
        }

        /* LEFT PANEL */
        .left-panel {
          flex: 0 0 55%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        /* Full page animated background */
        .full-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }

        .grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .left-content {
          position: relative;
          z-index: 10;
          padding: 3rem;
          max-width: 600px;
          width: 100%;
        }

        /* Brand Section */
        .brand-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .logo-mark {
          position: relative;
          width: 72px;
          height: 72px;
        }

        .logo-inner {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .logo-ring {
          position: absolute;
          inset: 0;
          border: 2px solid rgba(99, 102, 241, 0.5);
          border-radius: 50%;
        }

        .logo-ring.ring-2 {
          inset: 8px;
          border-color: rgba(168, 85, 247, 0.4);
          animation: pulse-ring 2s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }

        .logo-center {
          position: absolute;
          inset: 16px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
        }

        .brand-text {
          flex: 1;
        }

        .brand-name {
          display: flex;
          font-size: 3rem;
          font-weight: 800;
          margin: 0 0 0.25rem 0;
        }

        .brand-letter {
          background: linear-gradient(135deg, #fff 0%, #c7d2fe 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .brand-tagline {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          font-weight: 500;
        }

        /* Value Proposition */
        .value-prop {
          margin-bottom: 2.5rem;
        }

        .value-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          margin: 0 0 1rem 0;
        }

        .gradient-text {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .value-description {
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          line-height: 1.6;
        }

        /* Feature Cards */
        .features-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }

        .feature-card {
          position: relative;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .feature-card.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .feature-card-inner {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 1;
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-text {
          flex: 1;
          min-width: 0;
        }

        .feature-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }

        .feature-description {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.4;
        }

        .feature-arrow {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Trust Section */
        .trust-section {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .trust-badges {
          display: flex;
          gap: 1.5rem;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .trust-badge svg {
          color: rgba(99, 102, 241, 0.8);
        }

        /* RIGHT PANEL */
        .right-panel {
          flex: 0 0 45%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .form-header {
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .form-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        /* Social Buttons */
        .social-buttons {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .social-btn.google {
          flex: 1;
        }

        .social-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
        }

        .divider span {
          padding: 0 1rem;
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          font-size: 0.95rem;
          color: #fff;
          transition: all 0.2s ease;
        }

        .input-wrapper input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(99, 102, 241, 0.6);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .input-wrapper.focused input {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(99, 102, 241, 0.6);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.2s ease;
        }

        .input-wrapper.focused .input-icon {
          color: #a5b4fc;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #a5b4fc;
        }

        /* Error Message */
        .error-message {
          padding: 0.75rem 1rem;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Form Options */
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
        }

        .forgot-link {
          color: #a5b4fc;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-link:hover {
          color: #c7d2fe;
        }

        /* Submit Button */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Success State */
        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          text-align: center;
        }

        .success-icon {
          margin-bottom: 1rem;
        }

        .success-state h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .success-state p {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        /* Form Footer */
        .form-footer {
          text-align: center;
          margin-top: 1.75rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .switch-link {
          color: #a5b4fc;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .switch-link:hover {
          color: #c7d2fe;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .left-panel {
            flex: 0 0 50%;
          }
          .right-panel {
            flex: 0 0 50%;
          }
          .value-title {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
          }
          
          .left-panel {
            flex: none;
            padding: 3rem 1.5rem;
          }
          
          .right-panel {
            flex: none;
            padding: 2rem 1.5rem;
          }

          .left-content {
            padding: 0;
            max-width: 100%;
          }

          .brand-section {
            justify-content: center;
            text-align: center;
          }

          .value-prop {
            text-align: center;
          }

          .value-title {
            font-size: 1.5rem;
          }

          .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .feature-description {
            display: none;
          }

          .trust-badges {
            justify-content: center;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .form-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
