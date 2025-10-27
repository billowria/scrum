// src/pages/AuthPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient"; // ensure this exists
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiGithub,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

/**
 * Enhanced Auth Page
 * - Left: Animated SYNC logo (SVG + rotating arrows) + typewriter quote + floating avatars + soft particles
 * - Right: Glassmorphism form card with animated inputs, social buttons, password show/hide, success confetti
 *
 * Usage: <AuthPage mode="login" /> or <AuthPage mode="signup" />
 */

export default function AuthPage({ mode = "login" }) {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("manager"); // Default to manager for new companies
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(true);

  // Animated background mouse-follow gradient
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    function onMove(e) {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Typewriter quote for left side
  const quotes = [
    "Sync your team members — build together, faster.",
    "Bring clarity to collaboration. Sync, share, succeed.",
    "One standup. One rhythm. One synced team.",
    "Align goals • Share progress • Celebrate wins.",
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let mounted = true;
    const full = quotes[quoteIndex];
    let i = 0;
    let deleting = false;
    const speed = 28;
    const hold = 2000;

    function tick() {
      if (!mounted) return;
      if (!deleting) {
        if (i <= full.length) {
          setTyped(full.slice(0, i));
          i++;
          setTimeout(tick, speed);
        } else {
          // hold then delete
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
          setTimeout(tick, speed / 1.6);
        } else {
          // next quote
          setQuoteIndex((q) => (q + 1) % quotes.length);
        }
      }
    }
    tick();
    return () => {
      mounted = false;
    };
  }, [quoteIndex]); // cycles continuously

  // Floating avatars around logo (just initials)
  const avatars = [
    { name: "AK", color: "#7c3aed" },
    { name: "JS", color: "#06b6d4" },
    { name: "ML", color: "#f97316" },
    { name: "SR", color: "#10b981" },
  ];

  // Predefined avatar image URLs to assign on signup
  const AVATAR_URLS = [
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DDC03DE1-2A2A-4906-838F-D422C1D0B0CC_1_105_c.jpeg',
    'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/EDCED201-8799-4A1F-9B91-ACF8D65F0DE0_1_105_c.jpeg'
  ];

  // Minimal confetti using canvas for a signup success
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
      const count = 80;
      for (let i = 0; i < count; i++) {
        pieces.push({
          x: Math.random() * w,
          y: Math.random() * -h * 0.5,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 6,
          size: 6 + Math.random() * 8,
          color: ["#06b6d4", "#7c3aed", "#f97316", "#ef4444", "#10b981"][Math.floor(Math.random() * 5)],
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
        });
      }
    }

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (let p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.rot += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      pieces = pieces.filter((p) => p.y < h + 50);
      rafId = requestAnimationFrame(frame);
    }

    initCanvas();
    // don't spawn automatically - only when success toggles
    if (success) {
      spawnConfetti();
      frame();
      // stop after 3.5s
      setTimeout(() => {
        cancelAnimationFrame(rafId);
      }, 3500);
    }

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [success]);

  // Sign up / Sign in handlers with supabase (similar to original)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // success -> navigate
        navigate("/dashboard");
      } else {
        // For signup, ensure company name is provided
        if (!companyName) {
          throw new Error("Company name is required");
        }

        // Sanitize company name to create a URL-friendly slug
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (data?.user) {
          // First, create the user profile in the users table without company association
          const randomAvatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
          const { error: profileError } = await supabase.from("users").insert([
            {
              id: data.user.id,
              name,
              email,
              role: 'manager', // New signup is always a manager
              avatar_url: randomAvatarUrl,
              // company_id is initially null, will be set after company creation
            },
          ]);
          if (profileError) throw profileError;

          // Now create the company with the user as the creator
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

          // Finally, update the user record to link to the created company
          const { error: updateError } = await supabase
            .from('users')
            .update({ company_id: companyData.id })
            .eq('id', data.user.id);
            
          if (updateError) throw updateError;
        }
        setSuccess(true);
        // small UX delay for confetti and celebration
        setTimeout(() => navigate("/dashboard"), 1900);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // framer-motion variants
  const logoSpin = {
    rotate: [0, 360],
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 220, damping: 22 } },
  };

  // gradient position for right card background
  const dynamicBg = {
    background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(99,102,241,0.12), rgba(6,182,212,0.04))`,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-neutral-900 text-white relative overflow-hidden">
      {/* confetti canvas - sits on top */}
      <canvas ref={confettiCanvasRef} className="pointer-events-none absolute inset-0 z-50" />

      {/* Left column: Animated SYNC visual */}
      <div className="md:w-1/2 w-full px-8 md:px-16 py-12 relative flex items-center justify-center bg-gradient-to-br from-neutral-900 via-indigo-950 to-black">
        {/* Particles background (soft) */}
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#0ea5a0" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g1)" />
          </svg>
        </div>

        <div className="relative z-20 max-w-md">
          {/* Animated circular sync logo */}
          <div className="flex items-center gap-6">
            <motion.div
              className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl"
              animate={logoSpin}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              aria-hidden
            >
              {/* Outer rotating ring */}
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <defs>
                  <linearGradient id="lg" x1="0" x2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                {/* subtle ring */}
                <circle cx="60" cy="60" r="46" stroke="url(#lg)" strokeWidth="2.8" fill="rgba(255,255,255,0.02)" />
                {/* animated arrows - two paths forming a smooth sync */}
                <g transform="translate(60,60)">
                  <motion.path
                    d="M -36 0 A 36 36 0 0 1 20 -28"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="120"
                    strokeDashoffset={0}
                    animate={{ strokeDashoffset: [120, 0] }}
                    transition={{ repeat: Infinity, repeatType: "loop", duration: 4, ease: "easeInOut" }}
                  />
                  <motion.path
                    d="M 36 0 A 36 36 0 0 0 -20 28"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="120"
                    strokeDashoffset={120}
                    animate={{ strokeDashoffset: [120, 0] }}
                    transition={{ repeat: Infinity, repeatType: "loop", duration: 4, ease: "easeInOut", delay: 0.6 }}
                  />
                  {/* arrowheads */}
                  <motion.polygon
                    points="22,-28 28,-26 26,-20"
                    fill="#06b6d4"
                    animate={{ y: [0, -4, 0], opacity: [1, 0.8, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.6 }}
                  />
                  <motion.polygon
                    points="-22,28 -28,26 -26,20"
                    fill="#7c3aed"
                    animate={{ y: [0, 4, 0], opacity: [1, 0.8, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  />
                </g>
              </svg>

              {/* Glow */}
              <div className="absolute inset-0 rounded-full blur-2xl opacity-70" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 40%)" }} />
            </motion.div>

            {/* Letters: S Y N C - animated */}
            <div className="flex flex-col">
              <div className="text-6xl font-extrabold tracking-tight leading-none flex gap-1">
                {["S", "Y", "N", "C"].map((ltr, idx) => (
                  <motion.span
                    key={ltr}
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.08, type: "spring", stiffness: 240, damping: 20 }}
                    style={{
                      background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      textShadow: "0 6px 22px rgba(6,182,212,0.06)",
                    }}
                  >
                    {ltr}
                  </motion.span>
                ))}
              </div>

              {/* tagline */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <div className="mt-2 text-sm text-neutral-300 max-w-sm">
                  <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.9)" }}>Sync your team members</span>{" "}
                  <span className="block mt-2 text-xs text-neutral-400">{typed}<span className="blink">|</span></span>
                </div>
              </motion.div>

              {/* small CTA */}
              <div className="mt-4 flex gap-3 items-center">
                <button
                  onClick={() => {
                    // smooth scroll to form on right
                    const el = document.querySelector("#auth-card");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm backdrop-blur-sm border border-white/10"
                >
                  Get started
                </button>
                <button className="px-3 py-2 rounded-lg bg-white/4 text-sm border border-white/7 text-neutral-200">Learn more</button>
              </div>
            </div>
          </div>

          {/* Floating avatars around the logo - decorative */}
          <div className="mt-8 flex gap-3 items-center">
            {avatars.map((a, i) => (
              <motion.div
                key={i}
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shadow"
                style={{
                  background: a.color,
                  boxShadow: `0 8px 30px ${a.color}33`,
                }}
                animate={{ y: [0, -6, 0], x: [0, i % 2 === 0 ? -4 : 4, 0] }}
                transition={{ repeat: Infinity, duration: 3.6 + i * 0.3, ease: "easeInOut", delay: i * 0.2 }}
                aria-hidden
                title={`Team member ${a.name}`}
              >
                {a.name}
              </motion.div>
            ))}
            <div className="text-xs text-neutral-400 ml-2">4 people already using SquadSync</div>
          </div>
        </div>

        {/* decorative floating shapes */}
        <div className="absolute -left-6 -top-20 w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-700 to-cyan-400 opacity-10 blur-3xl" />
        <div className="absolute right-6 bottom-6 w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 opacity-6 blur-2xl" />
      </div>

      {/* Right column: Form */}
      <div
        id="auth-card"
        className="md:w-1/2 w-full flex items-center justify-center px-6 md:px-12 py-12 relative"
        style={dynamicBg}
      >
        <AnimatePresence>
          <motion.div
            className="relative z-10 w-full max-w-xl"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl" layout>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-2xl font-extrabold">Welcome{mode === "signup" ? " — Create account" : ""}</div>
                  <div className="text-sm text-neutral-300 mt-1">Secure access to your team's flow</div>
                </div>

                <div className="hidden md:flex flex-col items-end text-right">
                  <div className="text-xs text-neutral-300">Need help?</div>
                  <Link to="/support" className="text-sm text-cyan-300 font-semibold hover:underline">Contact support</Link>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="flex gap-3 mb-4">
                <button className="flex-1 flex items-center gap-3 justify-center py-3 rounded-lg bg-white/90 text-neutral-800 font-semibold shadow-sm hover:scale-102 transition-transform">
                  <FcGoogle /> Continue with Google
                </button>
                <button className="w-14 h-12 rounded-lg bg-white/6 flex items-center justify-center border border-white/8 hover:bg-white/8 transition">
                  <FiGithub />
                </button>
              </div>

              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-white/6" />
                <div className="text-xs text-neutral-400 uppercase font-semibold">or</div>
                <div className="flex-1 h-px bg-white/6" />
              </div>

              {/* Form */}
              {success ? (
                <div className="rounded-lg p-6 bg-gradient-to-r from-emerald-700 to-cyan-600 text-white">
                  <div className="text-lg font-bold">Welcome aboard!</div>
                  <div className="text-sm mt-1 opacity-90">Account created — redirecting you to your dashboard.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {mode === "signup" && (
                    <>
                      <div>
                        <label className="text-sm text-neutral-300 mb-2 block">Company name</label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-3 text-neutral-400" />
                          <input
                            required
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/8 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                            placeholder="Acme Corporation"
                            aria-label="Company name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-300 mb-2 block">Full name</label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-3 text-neutral-400" />
                          <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/8 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                            placeholder="John Doe"
                            aria-label="Full name"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm text-neutral-300 mb-2 block">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-3 text-neutral-400" />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/8 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                        placeholder="you@example.com"
                        aria-label="Email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-neutral-300 mb-2 block">Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-3 text-neutral-400" />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/8 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                        placeholder="••••••••"
                        aria-label="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-2.5 text-neutral-300 p-2 rounded hover:bg-white/6"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label className="text-sm text-neutral-300 mb-2 block">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/8 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                  )}

                  {error && <div className="text-sm text-rose-400 py-2 rounded bg-rose-900/10 border border-rose-800/10">{error}</div>}

                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm text-neutral-300">
                      <input type="checkbox" className="accent-cyan-400" />
                      Remember me
                    </label>

                    <Link to="/forgot" className="text-sm text-cyan-300 hover:underline">Forgot password?</Link>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow hover:scale-[1.01] transition-transform"
                      disabled={loading}
                      aria-busy={loading}
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                      ) : (
                        <>
                          {mode === "login" ? "Sign in" : "Create account"}
                          <FiArrowRight />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-4 text-center text-sm text-neutral-400">
                {mode === "login" ? (
                  <>
                    New here?{" "}
                    <Link to="/signup" className="text-cyan-300 font-semibold hover:underline">Create an account</Link>
                  </>
                ) : (
                  <>
                    Already a member?{" "}
                    <Link to="/login" className="text-cyan-300 font-semibold hover:underline">Sign in</Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* extra decorative floating shapes at the top-right */}
      <div className="pointer-events-none absolute top-6 right-6 opacity-20">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0" stopColor="#06b6d4" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r="60" fill="none" stroke="url(#g2)" strokeWidth="2" opacity="0.6" />
        </svg>
      </div>

      {/* Extra CSS keyframes & styles */}
      <style>{`
        /* small blink cursor for typewriter */
        .blink { opacity: 0.9; animation: blink 1s steps(2, start) infinite; }
        @keyframes blink { 50% { opacity: 0 } }

        /* subtle scaling hover */
        .scale-102 { transform: scale(1.02); }

        /* small focus ring fallbacks for non-tailwind */
        input:focus, select:focus, button:focus { outline: none; }

        /* micro animations for cards */
        .shadow-2xl { box-shadow: 0 30px 80px rgba(2,6,23,0.6); }

        /* fallback for backdrop blur on older browsers */
        .backdrop-blur-md { -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }

        /* small responsive tweaks */
        @media (max-width: 768px) {
          .text-6xl { font-size: 2.25rem; }
        }
      `}</style>
    </div>
  );
}
