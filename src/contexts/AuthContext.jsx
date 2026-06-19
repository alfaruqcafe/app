import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      });

      // Listen for changes on auth state (logged in, signed out, etc.)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile", error);
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: data?.role || 'staff' // Default to staff if no profile found
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

    return {
      ...data.user,
      role: profile?.role || 'staff'
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
