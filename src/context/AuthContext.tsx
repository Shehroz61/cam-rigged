'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDeviceLocked: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isDeviceLocked: false,
  error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyDevice = async (currentUser: User) => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        // Check if user has an existing device fingerprint
        const { data: devices, error: fetchError } = await supabase
          .from('user_devices')
          .select('*')
          .eq('user_id', currentUser.id);

        if (fetchError) throw fetchError;

        if (devices && devices.length > 0) {
          // Compare fingerprint
          const existingDevice = devices[0];
          if (existingDevice.fingerprint !== visitorId) {
            // Device locked! Force sign out
            await supabase.auth.signOut();
            setIsDeviceLocked(true);
            setError('Account is locked to another device. Please contact support to reset your device.');
            setUser(null);
            setSession(null);
          }
        } else {
          // Insert new device
          const { error: insertError } = await supabase
            .from('user_devices')
            .insert({ user_id: currentUser.id, fingerprint: visitorId });
            
          if (insertError) {
             // Handle case where perhaps RLS blocked it or concurrency
             console.error('Failed to register device:', insertError);
          }
        }
      } catch (err: any) {
        console.error('Error verifying device:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        await verifyDevice(session.user);
      } else {
        setIsLoading(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(true);
          setIsDeviceLocked(false);
          setError(null);
          
          if (session?.user) {
            await verifyDevice(session.user);
          } else {
            setIsLoading(false);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isDeviceLocked, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
