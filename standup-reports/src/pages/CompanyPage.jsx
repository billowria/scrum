import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FiArrowRight, FiCheckCircle, FiShield, FiMessageCircle,
    FiLinkedin, FiTwitter, FiTerminal, FiExternalLink
} from 'react-icons/fi';
import LandingNavbar from '../components/LandingNavbar';
import akhilAvatar from '../assets/avatars/akhil-avatar.png';
import utkarshAvatar from '../assets/avatars/utkarsh-avatar.jpg';


/**
 * SQUADSYNC_COMPANY_STRATEGY_V6
 * Focus: Professionalism, Minimalist, High-Standard Copy
 */

const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-3 mb-8">
        <span className="w-8 h-[1px] bg-indigo-500" />
        <span className="font-mono text-[10px] font-bold tracking-[0.4em] text-indigo-500 uppercase">
            {children}
        </span>
    </div>
);

// --- Section 1: Professional Hero ---

const Hero = () => {
    return (
        <section className="relative px-6 pt-48 pb-32 max-w-7xl mx-auto">
            <SectionLabel>ESTABLISHING_THE_CORE</SectionLabel>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-12 leading-[0.9]">
                Architecting the <br />
                <span className="text-white/20">Future of Work.</span>
            </h1>
            <div className="max-w-3xl border-l-2 border-indigo-500 pl-12 py-4">
                <p className="text-2xl md:text-3xl text-slate-300 font-light leading-relaxed">
                    SquadSync is a commitment to organizational clarity.
                    We believe that when teams communicate without friction,
                    innovation becomes the default state, not the exception.
                </p>
            </div>
        </section>
    );
};

// --- Section 2: Our Vision & Honesty ---

const VisionAndIntegrity = () => {
    return (
        <section className="py-32 px-6 bg-transparent">

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                    <div>
                        <SectionLabel>THE_SQUAD_PHILOSOPHY</SectionLabel>
                        <h2 className="text-4xl md:text-5xl font-black mb-10 leading-tight">
                            Radical Transparency. <br />
                            Absolute Integrity.
                        </h2>
                        <p className="text-lg text-slate-400 font-light leading-relaxed mb-8">
                            Most software hides behind complexity. We do the opposite. Our platform is built on
                            the principle of **Radical Integrity**. We don't use dark patterns, we don't obfuscate data,
                            and we don't compromise on the privacy of your human capital.
                        </p>
                        <ul className="space-y-6">
                            {[
                                "Verifiable data streams with zero manipulation.",
                                "Human-first design that respects focus and boundaries.",
                                "E2E encryption for all organizational intelligence.",
                                "Open-source ethos in our internal development culture."
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                                    <FiCheckCircle className="text-indigo-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="p-12 border border-white/5 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <FiShield className="text-indigo-500" /> Our Promise
                            </h3>
                            <p className="text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-6">
                                "We promise to maintain the highest standards of professional honesty.
                                Your trust is our most valuable asset. If we fail to deliver on our
                                core values, we expect to be held accountable by the community we serve."
                            </p>
                            <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <FiCheckCircle className="text-indigo-500" />
                                </div>
                                <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/40">Protocol Signature: Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Section 3: Leadership ---

const Leadership = () => {
    const leaders = [
        {
            name: "Akhil Billowria",
            role: "Chief Executive Officer",
            avatar: akhilAvatar,
            bio: "Driven by a passion for scaling human collaboration through elegant engineering. Akhil leads the strategic direction of SquadSync with a focus on radical honesty and excellence.",
            linkedin: "#",
            twitter: "#"
        },

        {
            name: "Utkarsh Bansal",
            role: "Product Ideation Head",
            avatar: utkarshAvatar,
            bio: "The creative force behind the SquadSync experience. Utkarsh bridges the gap between complex backend protocols and intuitive, beautiful user interfaces.",
            linkedin: "#",
            twitter: "#",
            portfolio: "https://portfolio-utkarsh-bansal.vercel.app/"
        }

    ];

    return (
        <section className="py-48 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <SectionLabel>LEADERSHIP_CORE</SectionLabel>
                    <h2 className="text-5xl md:text-7xl font-black mb-8">Architects of Change.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {leaders.map((leader, i) => (
                        <div
                            key={i}
                            onClick={() => leader.portfolio && window.open(leader.portfolio, '_blank')}
                            className={`group p-12 border border-white/5 rounded-[3rem] bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-500 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left ${leader.portfolio ? 'cursor-pointer hover:border-indigo-500/30 shadow-2xl shadow-transparent hover:shadow-indigo-500/10' : ''}`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors p-1">
                                    <img
                                        src={leader.avatar}
                                        alt={leader.name}
                                        className="w-full h-full object-cover rounded-2xl bg-white/5"
                                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=indigo&color=fff`}
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                    <h3 className="text-4xl font-black uppercase tracking-tight">{leader.name}</h3>
                                    {leader.portfolio && <FiExternalLink className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                <p className="font-mono text-sm text-indigo-500 mb-8 font-bold tracking-widest">{leader.role}</p>
                                <p className="text-slate-400 text-lg leading-relaxed mb-10 font-light">
                                    {leader.bio}
                                </p>
                                <div className="flex justify-center md:justify-start gap-4">
                                    <a
                                        href={leader.linkedin}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                                    >
                                        <FiLinkedin />
                                    </a>
                                    <a
                                        href={leader.twitter}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                                    >
                                        <FiTwitter />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- Section 4: Recruitment Form ---

const Recruitment = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [role, setRole] = useState("Engineer");

    const handleSubmit = () => {
        const text = `Initialize_Protocol: JOIN_TEAM\nNAME: ${name}\nDEPT: ${role}\nSTATUS: Awaiting_Handshake`;
        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/91XXXXXXXXXX?text=${encoded}`, '_blank');
    };

    return (
        <section className="py-48 px-6 bg-transparent">


            <div className="max-w-3xl mx-auto text-center">
                <SectionLabel>HUMAN_CAPITAL_INTEGRATION</SectionLabel>
                <h2 className="text-4xl md:text-6xl font-black mb-8 italic">Join the Movement.</h2>
                <p className="text-slate-400 text-lg mb-16 font-light">
                    We are looking for exceptional individuals who value integrity over ease.
                    If you believe you can add value to the SquadSync core, initialize contact below.
                </p>

                <div className="p-12 border border-white/10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-2xl text-left">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div>
                                    <label className="block text-xs font-mono font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Identification</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name / Handle"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 py-4 text-2xl focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!name}
                                    className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-20"
                                >
                                    Proceed to Next Protocol
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div>
                                    <label className="block text-xs font-mono font-bold text-white/30 uppercase tracking-[0.3em] mb-6">Specialization</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {["Engineer", "Product", "Growth", "Security"].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setRole(r)}
                                                className={`py-4 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${role === r ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/5 text-white/40 hover:border-white/20'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="px-8 py-5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all font-bold">Back</button>
                                    <button
                                        onClick={handleSubmit}
                                        className="flex-1 py-5 bg-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all"
                                    >
                                        Send Handshake <FiMessageCircle />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

// --- Footer ---

const Footer = () => {
    return (
        <footer className="py-24 px-6 border-t border-white/5 text-center">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="font-mono text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">
                    SQUADSYNC_OPERATING_SYSTEM // 2026
                </div>
                <div className="flex gap-12 font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">
                    <span className="hover:text-indigo-400 cursor-pointer">Security Protocol</span>
                    <span className="hover:text-indigo-400 cursor-pointer">Privacy Charter</span>
                    <span className="hover:text-indigo-400 cursor-pointer">Core Manifesto</span>
                </div>
            </div>
        </footer>
    );
};

// --- Main Page ---

const CompanyPage = () => {
    return (
        <div className="min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-indigo-500/30">
            <LandingNavbar />

            <main className="relative z-10 w-full">
                <Hero />
                <VisionAndIntegrity />
                <Leadership />
                <Recruitment />
                <Footer />
            </main>

        </div>
    );
};


export default CompanyPage;
