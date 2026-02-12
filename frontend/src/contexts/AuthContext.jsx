import { createContext, useContext, useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("printhub_token"));

  // Get auth headers
  function getAuthHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Save token to localStorage
  function saveToken(newToken) {
    localStorage.setItem("printhub_token", newToken);
    setToken(newToken);
  }

  // Clear token from localStorage
  function clearToken() {
    localStorage.removeItem("printhub_token");
    setToken(null);
  }

  // Send OTP to phone number via backend
  async function sendOTP(phoneNumber) {
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
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
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          otp,
          name: profileData.name,
          profileType: profileData.profileType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      saveToken(data.token);
      setCurrentUser({ id: data.user.id });
      setUserProfile(data.user);
      return data;
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  }

  // Login with phone number and OTP via backend
  async function login(phoneNumber, otp) {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      saveToken(data.token);
      setCurrentUser({ id: data.user.id });
      setUserProfile(data.user);
      return data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // Admin login with email/password
  async function adminLogin(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      saveToken(data.token);
      setCurrentUser({ id: data.user.id });
      setUserProfile(data.user);
      return data;
    } catch (error) {
      console.error("Error admin login:", error);
      throw error;
    }
  }

  function logout() {
    clearToken();
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function fetchUserProfile() {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { ...getAuthHeaders() },
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearToken();
          setCurrentUser(null);
          setUserProfile(null);
        }
        return null;
      }

      const profile = await response.json();
      setCurrentUser({ id: profile.id });
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async function updateProfile(data) {
    if (!currentUser || !token) return;
    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result = await response.json();
      setUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  // Check for existing token on mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        await fetchUserProfile();
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    token,
    getAuthHeaders,
    register,
    login,
    adminLogin,
    logout,
    updateProfile,
    fetchUserProfile,
    sendOTP,
    isAdmin: userProfile?.role === "admin",
    isAuthenticated: !!currentUser && !!token,
    profileType: userProfile?.profileType || "Regular",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
