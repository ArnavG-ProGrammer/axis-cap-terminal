"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of our auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAuthenticated: null,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth Session Error:", error);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      // Determine Admin Status (Can be expanded to check specific user metadata rules)
      const userEmail = session?.user?.email;
      const isUserAdmin = userEmail === 'arnavsqal@gmail.com' || userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL || session?.user?.user_metadata?.role === 'admin';
      setIsAdmin(!!isUserAdmin);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        
        const userEmail = session?.user?.email;
        const isUserAdmin = userEmail === 'arnavsqal@gmail.com' || userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL || session?.user?.user_metadata?.role === 'admin';
        setIsAdmin(!!isUserAdmin);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
