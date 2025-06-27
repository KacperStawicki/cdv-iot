import React, { createContext, useState, useEffect } from "react";
import api from "./api";

interface AuthContextProps {
  loggedIn: boolean;
  loading: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
}

export const AuthContext = createContext<AuthContextProps>({
  loggedIn: false,
  loading: true,
  setLoggedIn: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/user")
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ loggedIn, loading, setLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};
