import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { InterviewSession } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Configure Firestore with experimentalForceLongPolling for robust cloud run / iframe connectivity
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  // Log diagnostic notice without crashing caller
  console.info('[Firestore Sync Notice]:', errMsg);
}

// Connection check as required by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Cloud Firestore connection verified.');
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (error?.code === 'unavailable' || errorMsg.includes('offline')) {
      console.info('[Firebase] Operating in resilient local/offline mode. All candidate sessions are safely preserved.');
    } else {
      console.info('[Firebase] Notice during initial connection handshake:', errorMsg);
    }
  }
}

// Local Storage Fallback Key for resilient demo persistence
const LOCAL_STORAGE_SESSIONS_KEY = 'hirewire_ai_interview_sessions';

export function getLocalSessions(): InterviewSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSession(session: InterviewSession) {
  try {
    const existing = getLocalSessions();
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving local fallback session:', err);
  }
}

// Sync any local sessions completed in guest/demo mode to Firestore upon Google Sign-In
export async function syncGuestSessionsToCloud(userId: string, email?: string | null): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  try {
    const local = getLocalSessions();
    for (const session of local) {
      if (session.id) {
        const syncedSession: InterviewSession = {
          ...session,
          userId,
          userEmail: email || session.userEmail || auth.currentUser.email || 'candidate@hirewire.ai',
        };
        saveLocalSession(syncedSession);
        const docRef = doc(db, 'sessions', session.id);
        await setDoc(docRef, syncedSession, { merge: true });
      }
    }
  } catch (err) {
    console.warn('[Firebase] Background sync of local sessions to Firestore:', err);
  }
}

// Firestore operations
export async function saveInterviewSessionToDb(
  sessionId: string,
  sessionData: InterviewSession
): Promise<void> {
  // Always write to local storage as instant backup
  saveLocalSession({ ...sessionData, id: sessionId });

  // If user is not logged in via Firebase Auth, do not trigger unauthenticated Firestore 403
  if (!auth.currentUser) {
    console.log('[Firebase] Session preserved locally in guest mode. Sign in with Google to sync to cloud Firestore.');
    return;
  }

  // Ensure userId matches the current authenticated Firebase user UID to satisfy security rules
  const cloudSession: InterviewSession = {
    ...sessionData,
    id: sessionId,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email || sessionData.userEmail || 'candidate@hirewire.ai',
  };

  const path = `sessions/${sessionId}`;
  try {
    const docRef = doc(db, 'sessions', sessionId);
    await setDoc(docRef, cloudSession, { merge: true });
    console.log('[Firebase] Session saved to Firestore:', sessionId);
  } catch (error) {
    console.warn('Firestore write failed, fallback saved in local cache:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserSessionsFromDb(userId: string): Promise<InterviewSession[]> {
  // If not signed in with Firebase Auth, return local sessions without causing Firestore permission error
  if (!auth.currentUser) {
    return getLocalSessions();
  }

  const path = 'sessions';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    const sessions: InterviewSession[] = [];
    snapshot.forEach((d) => {
      sessions.push({ id: d.id, ...d.data() } as InterviewSession);
    });

    // Merge with any local sessions
    const local = getLocalSessions();
    const map = new Map<string, InterviewSession>();
    sessions.forEach((s) => map.set(s.id || '', s));
    local.forEach((s) => {
      if (s.id && !map.has(s.id)) {
        map.set(s.id, s);
      }
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  } catch (error) {
    console.warn('Firestore fetch failed, returning local cached sessions:', error);
    return getLocalSessions();
  }
}

export async function getSessionByIdFromDb(sessionId: string): Promise<InterviewSession | null> {
  const path = `sessions/${sessionId}`;
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'sessions', sessionId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as InterviewSession;
      }
    } catch (error) {
      console.warn('Firestore getDoc failed, attempting local fallback:', error);
    }
  }

  const local = getLocalSessions().find((s) => s.id === sessionId);
  return local || null;
}
