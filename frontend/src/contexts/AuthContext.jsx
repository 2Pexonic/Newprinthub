import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Setup reCAPTCHA verifier (not needed for backend OTP)
  function setupRecaptcha(containerId) {
    // No longer using Firebase phone auth, so no reCAPTCHA needed
    console.log('Using backend OTP system - no reCAPTCHA required');
  }

  // Send OTP to phone number via backend
  async function sendOTP(phoneNumber) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      // In development, show OTP in alert
      if (data.development?.otp) {
        alert(`Development Mode - Your OTP is: ${data.development.otp}`);
      }
      
      return data;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  }

  // Register with phone number and OTP via backend
  async function register(phoneNumber, otp, profileData) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          otp,
          name: profileData.name,
          profileType: profileData.profileType
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }
      
      // Sign in with custom token
      const { signInWithCustomToken } = await import('firebase/auth');
      const userCredential = await signInWithCustomToken(auth, data.token);
      
      setUserProfile(data.user);
      return userCredential;
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  }

  // Login with phone number and OTP via backend
  async function login(phoneNumber, otp) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }
      
      // Sign in with custom token
      const { signInWithCustomToken } = await import('firebase/auth');
      const userCredential = await signInWithCustomToken(auth, data.token);
      
      setUserProfile(data.user);
      return userCredential;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // Admin login with email/password (keeping for backward compatibility)
  async function adminLogin(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      await signOut(auth);
      throw new Error("Unauthorized: Admin access only");
    }
    await updateDoc(doc(db, "users", result.user.uid), {
      lastActive: serverTimestamp(),
    });
    return result;
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  async function fetchUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const profile = { id: userDoc.id, ...userDoc.data() };
        setUserProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  }

  async function updateProfile(data) {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), {
      ...data,
      lastActive: serverTimestamp(),
    });
    const updated = await fetchUserProfile(currentUser.uid);
    return updated;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    adminLogin,
    logout,
    updateProfile,
    fetchUserProfile,
    sendOTP,
    setupRecaptcha,
    isAdmin: userProfile?.role === "admin",
    isAuthenticated: !!currentUser,
    profileType: userProfile?.profileType || "Regular",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
