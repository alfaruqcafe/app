import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          // Kein Kunden-Login nötig: jeder Besucher bekommt eine anonyme,
          // dauerhafte Identität, damit Bestellungen ihm zugeordnet werden können.
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Anonymous sign-in failed', error);
            setLoading(false);
            return;
          }
          fetchProfile(data.user);
        }
      });

      // Listen for changes on auth state (logged in, signed out, etc.)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setUser(null);
          // Staff/Admin-Logout darf Kunden nicht ohne Identität zurücklassen.
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error) fetchProfile(data.user);
          else setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      if (authUser.is_anonymous) {
        setUser({ id: authUser.id, email: null, role: 'customer' });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile", error);
      }

      let finalRole = data?.role || 'staff';
      if (authUser.email === 'ahmed-saado@gmx.de') finalRole = 'admin';
      if (authUser.email === 'alfaruqcafe@gmx.de') finalRole = 'staff';

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: finalRole
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!supabase) {
      // Mock fallback for simple testing if Supabase is down
      if (email === 'admin' && password === 'admin') {
        const u = { role: 'admin', name: 'Admin User' };
        setUser(u);
        return u;
      }
      if (email === 'staff' && password === 'staff') {
        const u = { role: 'staff', name: 'Staff User' };
        setUser(u);
        return u;
      }
      throw new Error("Invalid credentials");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;

    // Fetch the role immediately to return it for the redirect logic in Login.jsx
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    let finalRole = profile?.role || 'staff';
    if (email === 'ahmed-saado@gmx.de') finalRole = 'admin';
    if (email === 'alfaruqcafe@gmx.de') finalRole = 'staff';

    return {
      ...data.user,
      role: finalRole
    };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
