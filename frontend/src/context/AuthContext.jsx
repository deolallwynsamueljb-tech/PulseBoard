import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("pb_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (userData) => {
    localStorage.setItem("pb_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("pb_user");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
