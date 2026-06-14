import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthModal, type AuthModalMode } from '../../components/forms/AuthModal';
import { resolveTheme } from '../../theme/theme';
import { useTheme } from '../../theme/theme-context';
import { AutomationSection } from './components/AutomationSection';
import { BenefitsSection } from './components/BenefitsSection';
import { CtaSection } from './components/CtaSection';
import { FeaturesSection } from './components/FeaturesSection';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { LandingFooter } from './components/LandingFooter';
import { LandingHeader } from './components/LandingHeader';
import { coerceAuthMode } from './landing.utils';

export function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const urlMode = coerceAuthMode(searchParams.get('auth'));
  const [localMode, setLocalMode] = useState<AuthModalMode | null>(null);
  const authMode: AuthModalMode | null = localMode ?? urlMode;
  const year = new Date().getFullYear();
  const resolvedTheme = useMemo(() => resolveTheme(preference), [preference]);

  useEffect(() => {
    setMenuOpen(false);
  }, [authMode]);

  const openAuth = (mode: AuthModalMode) => {
    if (mode === 'verify-email') {
      setLocalMode('verify-email');
    } else {
      setLocalMode(null);
      setSearchParams({ auth: mode });
    }
  };

  const closeAuth = () => {
    setLocalMode(null);
    navigate('/', { replace: true });
  };

  const toggleTheme = () => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="overflow-hidden">
      <LandingHeader
        menuOpen={menuOpen}
        resolvedTheme={resolvedTheme}
        onMenuToggle={() => setMenuOpen((value) => !value)}
        onThemeToggle={toggleTheme}
        onAuthOpen={openAuth}
      />
      <HeroSection onAuthOpen={openAuth} />
      <BenefitsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AutomationSection />
      <CtaSection onAuthOpen={openAuth} />
      <LandingFooter year={year} />

      <AuthModal mode={authMode} onClose={closeAuth} onModeChange={openAuth} />
    </div>
  );
}
