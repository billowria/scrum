import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedSyncLogo from './shared/AnimatedSyncLogo';
import CompactThemeToggle from './CompactThemeToggle';

// Reusable AnimatedLogo for consistency
const AnimatedLogo = () => <AnimatedSyncLogo size="md" showText={true} />;

const LandingNavbar = ({ activeSection = '' }) => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const lastScrollY = React.useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setHidden(true);
            } else {
                setHidden(false);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        // If we are on the landing page (path is /), scroll to id
        if (window.location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // If on another page, navigate to home then scroll (simple version: just nav home)
            navigate('/');
            // Optionally could use a hash link or state to scroll after nav
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    return (
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 transform ${hidden ? '-translate-y-full' : 'translate-y-0'} ${scrolled ? 'bg-[#0a0b14]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div onClick={() => navigate('/')} className="cursor-pointer">
                    <AnimatedLogo />
                </div>

                <div className="hidden md:flex gap-8 items-center text-sm font-medium">
                    <button onClick={() => scrollToSection('features')} className="text-slate-400 hover:text-white transition-colors">Product</button>
                    <button onClick={() => scrollToSection('pricing')} className="text-slate-400 hover:text-white transition-colors">Pricing</button>
                    <button onClick={() => navigate('/company')} className={`transition-colors ${window.location.pathname === '/company' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Company</button>

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    <button onClick={() => navigate('/login')} className="text-white hover:text-indigo-400 transition-colors">Sign In</button>
                    <CompactThemeToggle />
                </div>
            </div>
        </nav>
    );
};

export default LandingNavbar;
