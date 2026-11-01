import { createContext, useContext, useState } from "react";

// A box that holds the logged-in user for the whole website
const AuthContext = createContext(null);

// Wrap your app with this (see main.jsx)
export function AuthProvider({ children }) {
  // Start with the user saved in the browser (if there is one)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      return null;
    }
  });

  // Call this after a successful login
  function saveLogin(token, userData) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  // Call this when the user presses Logout
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

    // Call this after the user changed his name or phone
  function updateUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, saveLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use this in any page:  const { user, logout, updateUser } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}