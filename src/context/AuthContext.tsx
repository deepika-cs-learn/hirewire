import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, testConnection, syncGuestSessionsToCloud } from '../firebase';
import { UserProfile } from '../types';

export interface DemoCandidateProfile {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  photoURL: string;
  bioSnippet: string;
}

export const DEMO_PROFILES: DemoCandidateProfile[] = [
  {
    id: 'candidate_deepika',
    name: 'Deepika Gummalla',
    email: 'deepika.gummalla@hirewire.ai',
    targetRole: 'Senior Full-Stack Engineer',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    bioSnippet: '5+ years building distributed React/Node web services and high-concurrency cloud systems.',
  },
  {
    id: 'candidate_alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@hirewire.ai',
    targetRole: 'Distributed Systems & Go Architect',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    bioSnippet: 'Specialized in microservices, low-latency caches, Kubernetes, and Golang backend pipelines.',
  },
  {
    id: 'candidate_sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@hirewire.ai',
    targetRole: 'Technical Product Lead & Eng Manager',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    bioSnippet: 'Leads cross-functional agile teams, system architecture reviews, and engineering culture.',
  },
];

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string, targetRole?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateCandidateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInAsDemoCandidate: (profileIdOrName?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER_KEY = 'hirewire_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test Firestore connection on boot per Firebase skill guidelines
    testConnection();

    // Check for demo user in local storage
    const savedDemo = localStorage.getItem(DEMO_USER_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
      } catch {
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Candidate',
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
          targetRole: localStorage.getItem(`hirewire_role_${fbUser.uid}`) || 'Software Engineer',
        };
        setUser(profile);
        localStorage.removeItem(DEMO_USER_KEY);
        // Automatically sync any offline or demo sessions to user's Firestore collection
        syncGuestSessionsToCloud(fbUser.uid, fbUser.email);
      } else {
        // If not logged in via Firebase, check if demo user remains
        const currentDemo = localStorage.getItem(DEMO_USER_KEY);
        if (currentDemo) {
          try {
            setUser(JSON.parse(currentDemo));
          } catch {
            setUser(null);
          }
        } else {
          // Default to demo user so candidate can immediately test interviews
          const defaultDemo = DEMO_PROFILES[0];
          const defaultUser: UserProfile = {
            uid: defaultDemo.id,
            email: defaultDemo.email,
            displayName: defaultDemo.name,
            photoURL: defaultDemo.photoURL,
            targetRole: defaultDemo.targetRole,
          };
          setUser(defaultUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email Sign-In failed:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName?: string,
    targetRole?: string
  ) => {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, {
          displayName,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
        });
      }
      if (targetRole && cred.user) {
        localStorage.setItem(`hirewire_role_${cred.user.uid}`, targetRole);
      }
      if (cred.user) {
        setUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: displayName || cred.user.email?.split('@')[0] || 'Candidate',
          photoURL: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`,
          targetRole: targetRole || 'Software Engineer',
        });
      }
    } catch (err: any) {
      console.error('Email Sign-Up failed:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      throw err;
    }
  };

  const updateCandidateProfile = async (updates: Partial<UserProfile>) => {
    if (user) {
      const updated: UserProfile = { ...user, ...updates };
      setUser(updated);
      if (user.uid.startsWith('candidate_') || user.uid.startsWith('demo_')) {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
      } else if (auth.currentUser) {
        if (updates.displayName || updates.photoURL) {
          await updateProfile(auth.currentUser, {
            displayName: updates.displayName || auth.currentUser.displayName,
            photoURL: updates.photoURL || auth.currentUser.photoURL,
          });
        }
        if (updates.targetRole) {
          localStorage.setItem(`hirewire_role_${auth.currentUser.uid}`, updates.targetRole);
        }
      }
    }
  };

  const signInAsDemoCandidate = (profileIdOrName?: string) => {
    let chosen = DEMO_PROFILES.find((p) => p.id === profileIdOrName || p.name === profileIdOrName);
    if (!chosen) {
      chosen = DEMO_PROFILES[0];
    }
    const demo: UserProfile = {
      uid: chosen.id,
      email: chosen.email,
      displayName: chosen.name,
      photoURL: chosen.photoURL,
      targetRole: chosen.targetRole,
    };
    setUser(demo);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demo));
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    if (auth.currentUser) {
      await signOut(auth);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        updateCandidateProfile,
        signInAsDemoCandidate,
        logout,
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
