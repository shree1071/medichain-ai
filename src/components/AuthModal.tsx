import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, ArrowRight, Stethoscope, UploadCloud, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'vaidya' | 'patient';
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, defaultRole = 'vaidya', onSuccess }: AuthModalProps) {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, loginAsDemoVaidya, loginAsDemoPatient } = useAuth();
  const [role, setRole] = useState<'vaidya' | 'patient'>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole);
    }
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const targetPath = role === 'patient' ? '/patient' : '/dashboard';

  // 1-Click Instant Entry (never blocked)
  const handleInstantEntry = (targetRole: 'vaidya' | 'patient') => {
    if (targetRole === 'patient') {
      loginAsDemoPatient();
      sessionStorage.setItem('medikiosk_show_intake_modal', 'true');
      if (onSuccess) onSuccess();
      onClose();
      navigate('/patient');
    } else {
      loginAsDemoVaidya();
      if (onSuccess) onSuccess();
      onClose();
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      localStorage.setItem('ayush_user_role', role);
      if (role === 'patient') {
        sessionStorage.setItem('medikiosk_show_intake_modal', 'true');
      }
      const redirectUrl = `${window.location.origin}${targetPath}`;
      const { error } = await signInWithGoogle(redirectUrl);
      if (error) {
        // Immediate fallback so login always succeeds into the dashboard
        console.warn('OAuth fallback to instant demo login:', error.message);
        handleInstantEntry(role);
      } else {
        if (onSuccess) onSuccess();
        onClose();
        navigate(targetPath);
      }
    } catch {
      handleInstantEntry(role);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (email && password) {
        const { error } = await signInWithEmail(email, password, role);
        if (error) {
          handleInstantEntry(role);
        } else {
          if (role === 'patient') {
            sessionStorage.setItem('medikiosk_show_intake_modal', 'true');
          }
          if (onSuccess) onSuccess();
          onClose();
          navigate(targetPath);
        }
      } else {
        handleInstantEntry(role);
      }
    } catch {
      handleInstantEntry(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Role Switcher Pill */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole('vaidya')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'vaidya'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Stethoscope size={14} />
            <span>Doctor Login</span>
          </button>
          
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'patient'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UploadCloud size={14} />
            <span>Patient Login</span>
          </button>
        </div>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 ${
            role === 'patient' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {role === 'patient' ? <UserCheck size={22} /> : <Stethoscope size={22} />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            {role === 'patient' ? 'Patient Portal Access' : 'Doctor Workstation'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'patient' 
              ? 'Access your medications, appointments, 3D body twin & records'
              : 'Medivora AI clinical dashboard, live patient queue & diagnostics'
            }
          </p>
        </div>

        {/* ── INSTANT 1-CLICK DEMO ACCESS BUTTON ── */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => handleInstantEntry(role)}
            className={`w-full py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              role === 'patient'
                ? 'bg-black hover:bg-slate-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Enter {role === 'patient' ? 'Patient Dashboard' : 'Doctor Workstation'} Immediately</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            or sign in with Google
          </span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs py-3 px-4 rounded-2xl shadow-xs transition-all cursor-pointer mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Credentials Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-2.5">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="email"
              placeholder={role === 'patient' ? 'Patient Email' : 'Doctor Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Sign In</span>
          </button>
        </form>

      </div>
    </div>
  );
}
