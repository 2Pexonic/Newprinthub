import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
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

  async function register(email, password, profileData) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      name: profileData.name,
      phone: profileData.phone,
      email: email,
      profileType: profileData.profileType || "Regular",
      role: "user",
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      orders: 0,
      totalSpent: 0,
    };
    await setDoc(doc(db, "users", result.user.uid), userData);
    setUserProfile({ id: result.user.uid, ...userData });
    return result;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, "users", result.user.uid), {
      lastActive: serverTimestamp(),
    });
    return result;
  }

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
