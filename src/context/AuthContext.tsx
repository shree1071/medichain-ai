import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getCurrentAuthUser, 
  signInWithGoogle as authSignInWithGoogle, 
  signInWithEmail as authSignInWithEmail, 
  signOutUser 
} from '../lib/insforge';

interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<any>;
  signInWithEmail: (email: string, pass: string, role?: string) => Promise<any>;
  signOut: () => Promise<void>;
  loginAsDemoVaidya: () => void;
  loginAsDemoPatient: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for demo session stored in localStorage
    const demoUser = localStorage.getItem('ayush_demo_user');
    if (demoUser) {
      try {
        setUser(JSON.parse(demoUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('ayush_demo_user');
      }
    }

    // Check active InsForge session
    async function loadUser() {
      try {
        const { data, error } = await getCurrentAuthUser();
        if (data?.user && !error) {
          const role = (data.user as any).user_metadata?.role || localStorage.getItem('ayush_user_role') || 'vaidya';
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: (data.user as any).user_metadata?.name || data.user.email?.split('@')[0] || (role === 'patient' ? 'Patient User' : 'Vaidya Clinician'),
            role: role,
          });
        }
      } catch (err) {
        console.warn('InsForge auth hydration check:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const signInWithGoogle = async (redirectTo?: string) => {
    return await authSignInWithGoogle(redirectTo);
  };

  const signInWithEmail = async (email: string, pass: string, role: string = 'vaidya') => {
    const res = await authSignInWithEmail(email, pass);
    if (res.data?.user) {
      localStorage.setItem('ayush_user_role', role);
      setUser({
        id: res.data.user.id,
        email: res.data.user.email,
        name: (res.data.user as any).user_metadata?.name || res.data.user.email?.split('@')[0] || (role === 'patient' ? 'Patient User' : 'Vaidya Clinician'),
        role: role,
      });
    }
    return res;
  };

  const signOut = async () => {
    localStorage.removeItem('ayush_demo_user');
    localStorage.removeItem('ayush_user_role');
    setUser(null);
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  const loginAsDemoVaidya = () => {
    const demo: AuthUser = {
      id: 'd0c70000-0000-0000-0000-000000000001',
      email: 'vaidya.ananya@aiims.edu',
      name: 'Dr. Vaidya Ananya Sharma, BAMS MD',
      role: 'vaidya',
    };
    localStorage.setItem('ayush_demo_user', JSON.stringify(demo));
    localStorage.setItem('ayush_user_role', 'vaidya');
    setUser(demo);
  };

  const loginAsDemoPatient = () => {
    const demo: AuthUser = {
      id: 'p0a70000-0000-0000-0000-000000000001',
      email: 'govind.narain@gmail.com',
      name: 'Govind Narain',
      role: 'patient',
    };
    localStorage.setItem('ayush_demo_user', JSON.stringify(demo));
    localStorage.setItem('ayush_user_role', 'patient');
    setUser(demo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        loginAsDemoVaidya,
        loginAsDemoPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
