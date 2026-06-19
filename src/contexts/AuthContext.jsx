import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cafe_user")); } catch { return null; }
  });

  useEffect(() => { 
    if (user) localStorage.setItem("cafe_user", JSON.stringify(user)); 
    else localStorage.removeItem("cafe_user");
  }, [user]);

  const login = useCallback(async (username, password) => {
    // Mock login for now
    if (username === 'admin' && password === 'admin') {
      const adminUser = { username: 'admin', role: 'admin' };
      setUser(adminUser);
      return adminUser;
    }
    if (username === 'staff' && password === 'staff') {
      const staffUser = { username: 'staff', role: 'staff' };
      setUser(staffUser);
      return staffUser;
    }
    throw new Error('Ungültige Anmeldedaten');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin', isStaff: user?.role === 'staff' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
