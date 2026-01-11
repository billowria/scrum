// src/pages/AuthPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  motion,
  AnimatePresence
} from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff, FiGithub, FiCheckCircle,
  FiMessageCircle, FiCheckSquare, FiCalendar, FiLayers, FiEdit3, FiZap, FiSearch,
  FiMoreHorizontal, FiPlus, FiSend, FiClock, FiPaperclip
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

// --- Configuration ---

const APP_MODULES = [
  {
    id: 'chat',
    title: 'Team Chat',
    icon: FiMessageCircle,
    color: '#ec4899',
    desc: "Real-time collaboration",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    id: 'tasks',
    title: 'Task Board',
    icon: FiCheckSquare,
    color: '#f59e0b',
    desc: "Kanban workflows",
    gradient: "from-amber-400 to-orange-500"
  },
  {
    id: 'notes',
    title: 'Wiki & Notes',
    icon: FiEdit3,
    color: '#10b981',
    desc: "Shared knowledge",
    gradient: "from-emerald-400 to-teal-500"
  },
  {
    id: 'leave',
    title: 'Leave Mgmt',
    icon: FiCalendar,
    color: '#3b82f6',
    desc: "Availability tracking",
    gradient: "from-blue-400 to-cyan-500"
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: FiLayers,
    color: '#8b5cf6',
    desc: "Agile management",
    gradient: "from-violet-500 to-purple-600"
  },
];

// --- Mock Interfaces for "Holographic" Preview ---

const MockChat = () => (
  <div className="flex flex-col h-full p-4 gap-3">
    <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
        <FiMessageCircle className="text-pink-400 text-sm" />
      </div>
      <div className="text-xs font-medium text-white/90">#general</div>
    </div>
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.2 }}
        className={`flex gap-2 ${i === 2 ? 'flex-row-reverse' : ''}`}
      >
        <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
        <div className={`p-2 rounded-lg text-[10px] max-w-[80%] ${i === 2 ? 'bg-pink-500/20 text-pink-100' : 'bg-white/5 text-slate-300'}`}>
          <div className="h-2 w-24 bg-current opacity-20 rounded mb-1" />
          <div className="h-2 w-16 bg-current opacity-10 rounded" />
        </div>
      </motion.div>
    ))}
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="mt-auto h-8 rounded-full bg-white/5 border border-white/10 flex items-center px-3"
    >
      <div className="h-2 w-20 bg-white/10 rounded animate-pulse" />
      <FiSend className="ml-auto text-white/20 text-xs" />
    </motion.div>
  </div>
);

const MockTasks = () => (
  <div className="flex h-full p-3 gap-2 overflow-hidden">
    {['To Do', 'In Progress'].map((col, i) => (
      <div key={col} className="flex-1 flex flex-col gap-2 rounded-lg bg-white/5 p-2">
        <div className="text-[10px] font-bold text-slate-400 mb-1 flex justify-between">
          {col} <span className="bg-white/10 px-1 rounded">{i + 2}</span>
        </div>
        {[1, 2].map((card) => (
          <motion.div
            key={card}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.2) + (card * 0.1) }}
            className="p-2 rounded bg-white/5 border border-white/5 hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <div className="h-2 w-full bg-white/20 rounded mb-2" />
            <div className="flex justify-between items-center">
              <div className="h-1.5 w-6 bg-amber-500/40 rounded" />
              <div className="w-4 h-4 rounded-full bg-white/10" />
            </div>
          </motion.div>
        ))}
      </div>
    ))}
  </div>
);

const MockNotes = () => (
  <div className="h-full p-4 flex flex-col gap-3">
    <div className="flex items-center gap-2 text-emerald-400/80 mb-2">
      <FiEdit3 />
      <div className="h-2 w-32 bg-current opacity-40 rounded" />
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="space-y-2"
    >
      <div className="h-2 w-full bg-white/10 rounded" />
      <div className="h-2 w-full bg-white/10 rounded" />
      <div className="h-2 w-3/4 bg-white/10 rounded" />
    </motion.div>
    <div className="grid grid-cols-2 gap-2 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          className="aspect-square rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2"
        >
          <div className="w-6 h-6 rounded bg-emerald-500/20 mb-2" />
          <div className="h-1.5 w-8 bg-white/20 rounded" />
        </motion.div>
      ))}
    </div>
  </div>
);

const MockLeave = () => (
  <div className="h-full p-4">
    <div className="flex justify-between items-center mb-4 text-blue-400">
      <div className="text-xs font-bold">September 2025</div>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02 }}
          className={`aspect-square rounded-sm flex items-center justify-center text-[8px]
            ${[4, 12, 18, 25].includes(i) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-110 font-bold' :
              [5, 13, 19, 26].includes(i) ? 'bg-blue-500/20 text-blue-200' : 'bg-white/5 text-white/30'}
          `}
        >
          {i + 1}
        </motion.div>
      ))}
    </div>
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-4 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2"
    >
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
        <FiClock className="text-blue-400" />
      </div>
      <div>
        <div className="h-1.5 w-20 bg-white/30 rounded mb-1" />
        <div className="h-1.5 w-12 bg-white/10 rounded" />
      </div>
    </motion.div>
  </div>
);

const MockProjects = () => (
  <div className="h-full p-4 flex flex-col gap-3">
    <div className="flex gap-2 mb-2">
      <div className="h-6 w-20 bg-violet-500/20 rounded border border-violet-500/30" />
      <div className="h-6 w-16 bg-white/5 rounded border border-white/5" />
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
            <FiLayers className="text-violet-300 text-xs" />
          </div>
          <div className="flex-1">
            <div className="h-2 w-24 bg-white/20 rounded mb-1.5" />
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${60 + Math.random() * 30}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                className="h-full bg-violet-500"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

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

// --- Quantum Grid Effect (High Performance) ---
const QuantumGrid = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Configuration
    const SPACING = 40; // Space between dots
    const MOUSE_RADIUS = 200; // Interaction radius
    const REPEL_FORCE = 5; // How hard particles flee from mouse
    const RETURN_SPEED = 0.05; // Spring stiffness
    const DAMPING = 0.90; // Friction

    let points = [];
    let mouse = { x: -1000, y: -1000 };

    // Initialize Grid
    const initGrid = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      points = [];

      const cols = Math.ceil(width / SPACING);
      const rows = Math.ceil(height / SPACING);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING + SPACING / 2;
          const y = j * SPACING + SPACING / 2;
          points.push({
            x: x, // Current position
            y: y,
            ox: x, // Origin position
            oy: y,
            vx: 0, // Velocity
            vy: 0,
            baseAlpha: Math.random() * 0.3 + 0.1, // Base opacity
            size: 1.5
          });
        }
      }
    };

    // Handle Resize
    const handleResize = () => {
      initGrid();
    };
    window.addEventListener('resize', handleResize);
    initGrid();

    // Handle Mouse
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Use lighter composition for glow effect without expensive shadowBlur
      // ctx.globalCompositeOperation = 'lighten'; 

      points.forEach(p => {
        // Physics: Dist to mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Mouse Repulsion
        if (dist < MOUSE_RADIUS) {
          const force = (1 - dist / MOUSE_RADIUS) * REPEL_FORCE;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force;
          p.vy -= Math.sin(angle) * force;
        }

        // Spring Return to Origin
        const ox = p.ox - p.x;
        const oy = p.oy - p.y;
        p.vx += ox * RETURN_SPEED;
        p.vy += oy * RETURN_SPEED;

        // Friction
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // Update Position
        p.x += p.vx;
        p.y += p.vy;

        // Visuals
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const active = dist < MOUSE_RADIUS;

        // Color blending based on activity/speed
        // Idle: White/Slate
        // Active: Cyan/Purple
        ctx.beginPath();

        if (active || speed > 0.5) {
          const alpha = Math.min(1, p.baseAlpha + speed * 0.2);
          ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`; // Cyan glow
          ctx.arc(p.x, p.y, p.size + Math.min(2, speed), 0, Math.PI * 2);
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.baseAlpha})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none" />;
};


// --- Component Definition ---

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);

  // Subscription State
  const [signupStep, setSignupStep] = useState(1); // 1: Details, 2: Plan
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Fetch Plans on Mount (if signup)
  useEffect(() => {
    if (mode === "signup") {
      const fetchPlans = async () => {
        const { data } = await supabase.from('subscription_plans').select('*').order('price_monthly');
        if (data) {
          setPlans(data);
          // Default to Free
          const freePlan = data.find(p => p.name === 'Free');
          if (freePlan) setSelectedPlan(freePlan);
        }
      };
      fetchPlans();
    }
  }, [mode]);

  // Animation State for Left Panel
  const [activeTab, setActiveTab] = useState('chat');

  // Auto-cycle tabs
  useEffect(() => {
    const timer = setInterval(() => {
      const currentIndex = APP_MODULES.findIndex(m => m.id === activeTab);
      const nextIndex = (currentIndex + 1) % APP_MODULES.length;
      setActiveTab(APP_MODULES[nextIndex].id);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // Confetti logic
  const confettiCanvasRef = useRef(null);
  useEffect(() => {
    let rafId;
    let ctx = null;
    let w = 0; let h = 0; let pieces = [];
    function initCanvas() {
      const c = confettiCanvasRef.current;
      if (!c) return;
      ctx = c.getContext("2d");
      function resize() { w = (c.width = window.innerWidth); h = (c.height = window.innerHeight); }
      resize();
      window.addEventListener("resize", resize);
    }
    function spawnConfetti() {
      pieces = [];
      const count = 100;
      for (let i = 0; i < count; i++) {
        pieces.push({
          x: Math.random() * w, y: Math.random() * -h * 0.5,
          vx: (Math.random() - 0.5) * 8, vy: 2 + Math.random() * 8,
          size: 6 + Math.random() * 10,
          color: ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b"][Math.floor(Math.random() * 5)],
          rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 12,
        });
      }
    }
    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (let p of pieces) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rot += p.rotSpeed;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7); ctx.restore();
      }
      pieces = pieces.filter((p) => p.y < h + 50); rafId = requestAnimationFrame(frame);
    }
    initCanvas();
    if (success) { spawnConfetti(); frame(); setTimeout(() => cancelAnimationFrame(rafId), 4000); }
    return () => cancelAnimationFrame(rafId);
  }, [success]);

  // --- Form Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else if (mode === "signup") {
        if (signupStep === 1) {
          // Move to Plan Selection
          setSignupStep(2);
          setLoading(false);
          return;
        }

        // Final Signup
        if (!companyName) throw new Error("Company name is required");
        if (!selectedPlan) throw new Error("Please select a valid plan.");

        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data?.user) {
          const randomAvatarUrl = 'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg';
          await supabase.from("users").insert([{ id: data.user.id, name, email, role: 'manager', avatar_url: randomAvatarUrl }]);
          const { data: company } = await supabase.from('companies').insert([{ name: companyName, slug, created_by: data.user.id }]).select().single();
          await supabase.from('users').update({ company_id: company.id }).eq('id', data.user.id);

          // Create Subscription
          await supabase.from('subscriptions').insert([{
            company_id: company.id,
            plan_id: selectedPlan.id,
            status: 'active',
            // Set mock current period end (1 month)
            current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
          }]);
        }
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 2200);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess(true);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2200);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const activeModule = APP_MODULES.find(m => m.id === activeTab);

  return (
    <div className="auth-page">
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />

      {/* Full page animated background with Advanced Stars */}
      <div className="full-bg">
        <QuantumGrid />
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
      </div>

      <div
        className="auth-container"
      >

        {/* === LEFT PANEL: PRODUCT OS === */}
        <div className="left-panel">
          {/* Content Container */}
          <div
            className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-center p-8"
          >

            {/* Brand Header - UPDATED WITH NAVBAR PRO LOGO */}
            <motion.div
              className="absolute top-12 left-12 flex items-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Official Sync & Props Logo */}
              <div className="relative flex items-center justify-center">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg transform rotate-[-5deg]">
                  <div className="relative w-6 h-6">
                    <motion.div
                      className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white rounded-tl-full"
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white rounded-br-full"
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SYNC</span>
            </motion.div>

            {/* Main Visualization Grid */}
            <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center">

              {/* Center Core: Interface Projection */}
              <div
                className="relative w-[320px] h-[200px] bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transform-gpu transition-all duration-500 z-10"
              >

                {/* Core Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${activeModule.gradient} opacity-10 transition-colors duration-500`} />

                {/* Window Controls */}
                <div className="absolute top-0 left-0 right-0 h-8 border-b border-white/5 bg-white/5 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  <div className="ml-auto text-[10px] font-mono text-white/30">SYNC OS v2.0</div>
                </div>

                {/* Content Area - Animate Presence for switching mock UIs */}
                <div className="absolute inset-0 top-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      {activeTab === 'chat' && <MockChat />}
                      {activeTab === 'tasks' && <MockTasks />}
                      {activeTab === 'notes' && <MockNotes />}
                      {activeTab === 'leave' && <MockLeave />}
                      {activeTab === 'projects' && <MockProjects />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Orbiting Feature Nodes */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {APP_MODULES.map((module, index) => {
                  const angle = (index / APP_MODULES.length) * 2 * Math.PI - (Math.PI / 2); // Start from top
                  const radius = 240; // Orbit radius
                  // Calculate position on circle
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isActive = activeTab === module.id;

                  return (
                    <motion.button
                      key={module.id}
                      className={`absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 rounded-2xl flex items-center justify-center 
                                        backdrop-blur-md border transition-all duration-300 pointer-events-auto cursor-pointer
                                        ${isActive
                          ? 'bg-white/20 border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-110 z-50'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/40 hover:text-white'
                        }
                                    `}
                      style={{ x, y }}
                      onClick={() => setActiveTab(module.id)}
                      whileHover={{ scale: 1.2, zIndex: 60 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <module.icon className={`text-2xl transition-colors duration-300 ${isActive ? 'text-white' : ''}`} style={{ color: isActive ? module.color : undefined }} />

                      {/* Connection Line to Center */}
                      <svg className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none overflow-visible">
                        <motion.line
                          x1="50%" y1="50%"
                          x2={150 - x * 0.6} // Point towards center but stop short
                          y2={150 - y * 0.6}
                          stroke={module.color}
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{
                            pathLength: isActive ? 1 : 0,
                            opacity: isActive ? 0.4 : 0
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </svg>

                      {/* Tooltip Label */}
                      <motion.div
                        className="absolute top-full mt-3 text-center w-32 bg-black/80 backdrop-blur text-xs px-2 py-1 rounded border border-white/10 pointer-events-none"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : -5 }}
                      >
                        <div className="font-bold text-white">{module.title}</div>
                        <div className="text-[10px] text-slate-400">{module.desc}</div>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Orbit Ring visual */}
              <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.8] animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-0 rounded-full border border-dashed border-white/5 scale-[0.8] animate-[spin_40s_linear_infinite_reverse]" />

            </div>

            {/* Bottom Value Prop */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                One Workspace. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Infinite Possibilities.</span>
              </h2>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                Replace your disconnected tools with a unified operating system designed for high-performance agile teams.
              </p>
            </motion.div>

          </div>
        </div>

        {/* === RIGHT PANEL: GLASS FORM (NO 3D, Subtle expansion on hover) === */}
        <div className="right-panel">
          <div className="form-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                className="form-card"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
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
                    {mode === "login" && "Welcome back"}
                    {mode === "signup" && "Create account"}
                    {mode === "forgot" && "Reset password"}
                    {mode === "reset" && "Set new password"}
                  </motion.h2>
                  <motion.p
                    className="form-subtitle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {mode === "login" && "Sign in to continue to your workspace"}
                    {mode === "signup" && "Start your 14-day free trial"}
                    {mode === "forgot" && "Enter your email to receive a reset link"}
                    {mode === "reset" && "Enter a new secure password for your account"}
                  </motion.p>
                </div>

                {/* Social Buttons */}
                {(mode === "login" || mode === "signup") && (
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
                )}

                {(mode === "login" || mode === "signup") && (
                  <motion.div
                    className="divider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span>or continue with email</span>
                  </motion.div>
                )}

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
                    <h3>
                      {mode === "forgot" ? "Check your email" : "Success!"}
                    </h3>
                    <p>
                      {mode === "forgot"
                        ? "We've sent a reset link to your email."
                        : mode === "reset"
                          ? "Your password has been updated. Redirecting..."
                          : "Welcome aboard! Redirecting..."}
                    </p>
                    {mode === "forgot" && (
                      <button
                        onClick={() => setSuccess(false)}
                        className="switch-link mt-4"
                      >
                        Try another email
                      </button>
                    )}
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

                    {/* Step 2: Plan Selection */}
                    {mode === "signup" && signupStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-white font-bold text-center mb-2">Select Your Plan</h3>
                        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {plans.map(plan => (
                            <div
                              key={plan.id}
                              onClick={() => setSelectedPlan(plan)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-white">{plan.name}</span>
                                <span className="text-indigo-400 font-mono">${plan.price_monthly}</span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {plan.max_users ? `Up to ${plan.max_users} users` : 'Unlimited users'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(mode === "login" || mode === "signup" || mode === "forgot") && (
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
                    )}

                    {(mode === "login" || mode === "signup" || mode === "reset") && (
                      <div className="input-group">
                        <label>{mode === "reset" ? "New Password" : "Password"}</label>
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
                    )}

                    {error && (
                      <motion.div
                        className="error-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}

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

                    <motion.button
                      type="submit"
                      className="submit-btn"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <div className="spinner">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      ) : (
                        <>
                          <span>
                            {mode === "login" && "Sign In"}
                            {mode === "signup" && "Create Account"}
                            {mode === "forgot" && "Send Reset Link"}
                            {mode === "reset" && "Update Password"}
                          </span>
                          <FiArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                    {mode === "signup" && signupStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="w-full text-center text-gray-400 text-sm hover:text-white mt-2"
                      >
                        Back to Details
                      </button>
                    )}
                  </motion.form>
                )}

                <motion.div
                  className="form-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {mode === "login" && (
                    <>
                      Don't have an account?{" "}
                      <Link to="/signup" className="switch-link">Sign up free</Link>
                    </>
                  )}
                  {mode === "signup" && (
                    <>
                      Already have an account?{" "}
                      <Link to="/login" className="switch-link">Sign in</Link>
                    </>
                  )}
                  {(mode === "forgot" || mode === "reset") && (
                    <>
                      Back to{" "}
                      <Link to="/login" className="switch-link">Sign in</Link>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        /* Base */
        .auth-page {
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
        }

        .confetti-canvas {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
        }

        .auth-container {
          display: flex; min-height: 100vh; position: relative; z-index: 5;
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

        /* LEFT PANEL - 3D Perspective */
        .left-panel {
          flex: 0 0 60%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        /* RIGHT PANEL */
        .right-panel {
          flex: 0 0 40%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .form-container {
          width: 100%; max-width: 420px; position: relative; z-index: 10;
        }

        /* Glass Form Card */
        .form-card {
          background: rgba(255, 255, 255, 0.05); 
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-radius: 24px; padding: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .form-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .form-header { text-align: center; margin-bottom: 1.75rem; }
        .form-title { font-size: 1.75rem; font-weight: 700; color: #fff; margin: 0 0 0.5rem 0; }
        .form-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.5); margin: 0; }

        /* Social Buttons */
        .social-buttons { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
        .social-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;
          font-size: 0.9rem; font-weight: 500; color: #fff; cursor: pointer; transition: all 0.2s ease;
        }
        .social-btn.google { flex: 1; }
        .social-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }

        /* Divider */
        .divider { display: flex; align-items: center; margin: 1.5rem 0; color: rgba(255, 255, 255, 0.4); font-size: 0.8rem; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1); }
        .divider span { padding: 0 1rem; }

        /* Inputs */
        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.85rem; font-weight: 600; color: rgba(255, 255, 255, 0.7); }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-wrapper input {
          width: 100%; padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px; font-size: 0.95rem; color: #fff; transition: all 0.2s ease;
        }
        .input-wrapper input:focus, .input-wrapper.focused input {
          outline: none; background: rgba(0, 0, 0, 0.3); border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .input-wrapper input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .input-icon { position: absolute; left: 1rem; color: rgba(255, 255, 255, 0.4); transition: color 0.2s ease; }
        .input-wrapper.focused .input-icon { color: #818cf8; }
        .password-toggle {
          position: absolute; right: 1rem; background: none; border: none;
          color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 0.25rem; display: flex;
        }
        .password-toggle:hover { color: #818cf8; }

        .error-message {
          padding: 0.75rem 1rem; background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 10px;
          color: #fca5a5; font-size: 0.875rem; font-weight: 500;
        }

        .form-options { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; color: rgba(255, 255, 255, 0.6); cursor: pointer; }
        .checkbox-label input { width: 16px; height: 16px; accent-color: #6366f1; }
        .forgot-link { color: #818cf8; font-weight: 600; text-decoration: none; transition: color 0.2s ease; }
        .forgot-link:hover { color: #a5b4fc; }

        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.875rem 1.5rem; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none; border-radius: 12px; color: #fff; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); transition: all 0.2s ease;
        }
        .submit-btn:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4); transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner { display: flex; align-items: center; justify-content: center; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .success-state { display: flex; flex-direction: column; align-items: center; padding: 2rem; text-align: center; }
        .success-icon { margin-bottom: 1rem; }
        .success-state h3 { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0 0 0.5rem 0; }
        .success-state p { font-size: 0.95rem; color: rgba(255, 255, 255, 0.6); margin: 0; }

        .form-footer {
          text-align: center; margin-top: 1.75rem; padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.9rem; color: rgba(255, 255, 255, 0.5);
        }
        .switch-link { color: #818cf8; font-weight: 600; text-decoration: none; transition: color 0.2s ease; }
        .switch-link:hover { color: #a5b4fc; }

        @media (max-width: 1024px) {
          .left-panel { display: none; }
          .right-panel { flex: 1; }
        }
      `}</style>
    </div>
  );
}
