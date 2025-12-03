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
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

/**
 * Premium Auth Page - Light Theme with Glassmorphism
 * - Animated gradient background with floating orbs
 * - Glassmorphic form cards with micro-interactions
 * - Rich hover effects and smooth transitions
 * - Animated particles and decorative elements
 */

export default function AuthPage({ mode = "login" }) {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("manager");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Focus states for input animations
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);

  // Mouse position for interactive gradient
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    function onMove(e) {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Typewriter effect
  const quotes = [
    "Seamless collaboration starts here ✨",
    "Build better teams, ship faster 🚀",
    "One platform. Infinite possibilities 💫",
    "Transform how your team works together 🎯",
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let mounted = true;
    const full = quotes[quoteIndex];
    let i = 0;
    let deleting = false;
    const speed = 35;
    const hold = 2500;

    function tick() {
      if (!mounted) return;
      if (!deleting) {
        if (i <= full.length) {
          setTyped(full.slice(0, i));
          i++;
          setTimeout(tick, speed);
        } else {
          setTimeout(() => {
            deleting = true;
            i = full.length;
            tick();
          }, hold);
        }
      } else {
        if (i >= 0) {
          setTyped(full.slice(0, i));
          i--;
          setTimeout(tick, speed / 1.8);
        } else {
          setQuoteIndex((q) => (q + 1) % quotes.length);
        }
      }
    }
    tick();
    return () => {
      mounted = false;
    };
  }, [quoteIndex]);

  // Floating avatars
  const avatars = [
    { name: "AK", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { name: "JS", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { name: "ML", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { name: "SR", color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  ];

  // Predefined avatar URLs
  const AVATAR_URLS = [
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DDC03DE1-2A2A-4906-838F-D422C1D0B0CC_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/EDCED201-8799-4A1F-9B91-ACF8D65F0DE0_1_105_c.jpeg'
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
    <div className="auth-page-container">
      {/* Confetti canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />

      {/* Animated background with floating orbs */}
      <div className="animated-background">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        <div className="gradient-orb orb-4" />
        <div className="gradient-orb orb-5" />

        {/* Floating particles */}
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${12 + Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* Interactive gradient overlay */}
        <div
          className="interactive-gradient"
          style={{
            background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(102,126,234,0.15), transparent 50%)`,
          }}
        />
      </div>

      <div className="auth-content">
        {/* Left Panel */}
        <motion.div
          className="left-panel"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="left-content">
            {/* Logo with animation */}
            <div className="logo-section">
              <motion.div
                className="logo-container"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 25,
                  ease: "linear",
                }}
              >
                <svg viewBox="0 0 120 120" className="logo-svg">
                  <defs>
                    <linearGradient id="logo-gradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="50%" stopColor="#764ba2" />
                      <stop offset="100%" stopColor="#f093fb" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="46" stroke="url(#logo-gradient)" strokeWidth="3" fill="rgba(255,255,255,0.1)" />

                  <g transform="translate(60,60)">
                    <motion.path
                      d="M -36 0 A 36 36 0 0 1 20 -28"
                      fill="none"
                      stroke="#667eea"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="120"
                      animate={{ strokeDashoffset: [120, 0] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    />
                    <motion.path
                      d="M 36 0 A 36 36 0 0 0 -20 28"
                      fill="none"
                      stroke="#f093fb"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="120"
                      animate={{ strokeDashoffset: [120, 0] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.polygon
                      points="22,-28 28,-26 26,-20"
                      fill="#f093fb"
                      animate={{ y: [0, -5, 0], opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.polygon
                      points="-22,28 -28,26 -26,20"
                      fill="#667eea"
                      animate={{ y: [0, 5, 0], opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                  </g>
                </svg>
                <div className="logo-glow" />
              </motion.div>

              <div className="brand-text">
                <div className="brand-name">
                  {["S", "Y", "N", "C"].map((letter, idx) => (
                    <motion.span
                      key={letter}
                      initial={{ y: 30, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.3 + idx * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      className="brand-letter"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  className="brand-tagline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  Your team's command center
                </motion.div>

                <motion.div
                  className="typewriter-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {typed}<span className="cursor-blink">|</span>
                </motion.div>
              </div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <button
                onClick={() => {
                  const el = document.querySelector("#auth-form-card");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="cta-primary"
              >
                <span>Get Started</span>
                <FiArrowRight />
              </button>
              <button className="cta-secondary">
                Learn More
              </button>
            </motion.div>

            {/* Floating Avatars */}
            <motion.div
              className="floating-avatars"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              {avatars.map((avatar, i) => (
                <motion.div
                  key={i}
                  className="avatar"
                  style={{ background: avatar.color }}
                  animate={{
                    y: [0, -8, 0],
                    x: [0, i % 2 === 0 ? -5 : 5, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4 + i * 0.4,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                >
                  {avatar.name}
                </motion.div>
              ))}
              <div className="avatar-text">Join 1,000+ teams already syncing</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Form */}
        <motion.div
          className="right-panel"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              id="auth-form-card"
              className="form-card-glass"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Header */}
              <div className="form-header">
                <div>
                  <motion.h1
                    className="form-title"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {mode === "login" ? "Welcome back" : "Create account"}
                  </motion.h1>
                  <motion.p
                    className="form-subtitle"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {mode === "login"
                      ? "Sign in to continue to your workspace"
                      : "Start your journey with us today"}
                  </motion.p>
                </div>
                <Link to="/support" className="help-link">
                  Need help?
                </Link>
              </div>

              {/* Social Buttons */}
              <motion.div
                className="social-buttons"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button className="social-btn social-google">
                  <FcGoogle size={20} />
                  <span>Continue with Google</span>
                </button>
                <button className="social-btn social-github">
                  <FiGithub size={18} />
                </button>
              </motion.div>

              {/* Divider */}
              <motion.div
                className="divider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <span>or</span>
              </motion.div>

              {/* Success State */}
              {success ? (
                <motion.div
                  className="success-card"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <FiCheckCircle size={48} />
                  </motion.div>
                  <h3>Welcome aboard!</h3>
                  <p>Your account is ready. Redirecting to dashboard...</p>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleSubmit}
                  className="auth-form"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {mode === "signup" && (
                    <>
                      {/* Company Name */}
                      <div className="input-group">
                        <label className="input-label">Company Name</label>
                        <div className={`input-wrapper ${companyFocused ? 'focused' : ''}`}>
                          <motion.div
                            className="input-icon"
                            animate={{ scale: companyFocused ? 1.1 : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FiUser />
                          </motion.div>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            onFocus={() => setCompanyFocused(true)}
                            onBlur={() => setCompanyFocused(false)}
                            placeholder="Acme Corporation"
                            required
                            className="glass-input"
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <div className={`input-wrapper ${nameFocused ? 'focused' : ''}`}>
                          <motion.div
                            className="input-icon"
                            animate={{ scale: nameFocused ? 1.1 : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FiUser />
                          </motion.div>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                            placeholder="John Doe"
                            required
                            className="glass-input"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className={`input-wrapper ${emailFocused ? 'focused' : ''}`}>
                      <motion.div
                        className="input-icon"
                        animate={{ scale: emailFocused ? 1.1 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiMail />
                      </motion.div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="you@example.com"
                        required
                        className="glass-input"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <div className={`input-wrapper ${passwordFocused ? 'focused' : ''}`}>
                      <motion.div
                        className="input-icon"
                        animate={{ scale: passwordFocused ? 1.1 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiLock />
                      </motion.div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="••••••••"
                        required
                        className="glass-input"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </motion.button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Remember & Forgot */}
                  <div className="form-options">
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <Link to="/forgot" className="forgot-link">
                      Forgot password?
                    </Link>
                  </div>

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
                        className="loading-spinner"
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
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                          <FiArrowRight />
                        </motion.div>
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* Footer */}
              <motion.div
                className="form-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {mode === "login" ? (
                  <>
                    New to SYNC?{" "}
                    <Link to="/signup" className="switch-link">
                      Create an account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link to="/login" className="switch-link">
                      Sign in
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        /* Container */
        .auth-page-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Confetti Canvas */
        .confetti-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
        }

        /* Animated Background */
        .animated-background {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, 
            #e0c3fc 0%, 
            #8ec5fc 25%, 
            #fbc2eb 50%, 
            #a6c1ee 75%, 
            #ffecd2 100%
          );
          z-index: 0;
        }

        /* Floating Orbs */
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.6;
          animation: float 30s ease-in-out infinite;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.4), transparent);
          top: -10%;
          left: -10%;
          animation-duration: 25s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(240, 147, 251, 0.4), transparent);
          top: 20%;
          right: -5%;
          animation-duration: 30s;
          animation-delay: -5s;
        }

        .orb-3 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(79, 172, 254, 0.3), transparent);
          bottom: -15%;
          left: 10%;
          animation-duration: 35s;
          animation-delay: -10s;
        }

        .orb-4 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(118, 75, 162, 0.3), transparent);
          bottom: 10%;
          right: 20%;
          animation-duration: 28s;
          animation-delay: -15s;
        }

        .orb-5 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(67, 233, 123, 0.25), transparent);
          top: 40%;
          left: 50%;
          animation-duration: 32s;
          animation-delay: -8s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.9);
          }
        }

        /* Floating Particles */
        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: particle-float linear infinite;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        @keyframes particle-float {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0;
          }
        }

        /* Interactive Gradient */
        .interactive-gradient {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: background 0.3s ease;
        }

        /* Content Layout */
        .auth-content {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .auth-content {
            flex-direction: column;
          }
        }

        /* Left Panel */
        .left-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          position: relative;
        }

        .left-content {
          max-width: 500px;
          width: 100%;
        }

        /* Logo Section */
        .logo-section {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .logo-container {
          position: relative;
          width: 140px;
          height: 140px;
        }

        .logo-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 8px 24px rgba(102, 126, 234, 0.3));
        }

        .logo-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.2), transparent 70%);
          border-radius: 50%;
          filter: blur(30px);
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        /* Brand Text */
        .brand-text {
          flex: 1;
        }

        .brand-name {
          display: flex;
          gap: 4px;
          font-size: 4rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .brand-letter {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .brand-tagline {
          font-size: 1rem;
          color: #4a5568;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .typewriter-text {
          font-size: 0.9rem;
          color: #718096;
          min-height: 24px;
          font-style: italic;
        }

        .cursor-blink {
          animation: blink 1s steps(2) infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        /* CTA Buttons */
        .cta-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .cta-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
          transition: all 0.3s ease;
        }

        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.45);
        }

        .cta-secondary {
          padding: 0.875rem 1.75rem;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          color: #4a5568;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: translateY(-2px);
        }

        /* Floating Avatars */
        .floating-avatars {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          color: white;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: 3px solid rgba(255, 255, 255, 0.8);
        }

        .avatar-text {
          font-size: 0.875rem;
          color: #718096;
          font-weight: 500;
        }

        /* Right Panel */
        .right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        /* Glassmorphic Form Card */
        .form-card-glass {
          width: 100%;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }

        /* Form Header */
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 800;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }

        .form-subtitle {
          font-size: 0.95rem;
          color: #718096;
          margin: 0;
        }

        .help-link {
          font-size: 0.875rem;
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .help-link:hover {
          color: #764ba2;
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
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #2d3748;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .social-google {
          flex: 1;
        }

        .social-github {
          padding: 0.875rem 1.25rem;
        }

        .social-btn:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          color: #a0aec0;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent);
        }

        .divider span {
          padding: 0 1rem;
        }

        /* Auth Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Input Groups */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4a5568;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.5);
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .input-wrapper.focused {
          background: rgba(255, 255, 255, 0.7);
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #a0aec0;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }

        .input-wrapper.focused .input-icon {
          color: #667eea;
        }

        .glass-input {
          flex: 1;
          padding: 0.875rem 1rem 0.875rem 3rem;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.95rem;
          color: #2d3748;
          font-weight: 500;
        }

        .glass-input::placeholder {
          color: #a0aec0;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #667eea;
        }

        /* Error Message */
        .error-message {
          padding: 0.875rem 1rem;
          background: rgba(245, 101, 101, 0.1);
          border: 1px solid rgba(245, 101, 101, 0.3);
          border-radius: 12px;
          color: #c53030;
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
          color: #4a5568;
          font-weight: 500;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #667eea;
          cursor: pointer;
        }

        .forgot-link {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-link:hover {
          color: #764ba2;
        }

        /* Submit Button */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
          transition: all 0.3s ease;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.45);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Success Card */
        .success-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem 2rem;
          text-align: center;
          color: #2d3748;
        }

        .success-card svg {
          color: #48bb78;
        }

        .success-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .success-card p {
          font-size: 0.95rem;
          color: #718096;
          margin: 0;
        }

        /* Form Footer */
        .form-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.9rem;
          color: #718096;
        }

        .switch-link {
          color: #667eea;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .switch-link:hover {
          color: #764ba2;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .brand-name {
            font-size: 2.5rem;
          }

          .logo-section {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .form-card-glass {
            padding: 2rem 1.5rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .help-link {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
