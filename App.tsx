
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Routines } from './screens/Routines';
import { Workout } from './screens/Workout';
import { History } from './screens/History';
import { Profile } from './screens/Profile';
import { Onboarding } from './screens/Onboarding';
import { PlateCalculator } from './screens/PlateCalculator';
import { RoutineDetail } from './screens/RoutineDetail';
import { CalendarView } from './screens/CalendarView';
import { Nutrition } from './screens/Nutrition';
import { Subscription } from './screens/Subscription'; 
import { Terms, Privacy, Contact, License } from './screens/Legal';
import { HelpCenter, SystemStatus } from './screens/Support';
import { storage } from './services/storage';
import { supabase } from './services/supabase';
import { UserProfile } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, hasProfile: boolean }> = ({ children, hasProfile }) => {
  if (!hasProfile) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState(storage.load());
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // 1. Initial Cloud Hydration attempt
    const init = async () => {
      try {
        await storage.hydrateFromCloud(); // Try to update local storage from cloud
        setAppState(storage.load()); // Reload state into React
      } catch (e) {
        console.warn("Init hydration failed:", e);
      } finally {
        setIsAuthChecking(false);
      }
    };
    init();

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthChecking(true);
        await storage.hydrateFromCloud();
        setAppState(storage.load());
        setIsAuthChecking(false);
      } else if (event === 'SIGNED_OUT') {
        setAppState(storage.reset());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthComplete = (profile: UserProfile) => {
    setAppState(storage.load());
  };

  if (isAuthChecking) {
     return (
       <div className="min-h-screen bg-[#0A0F0D] flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)] animate-pulse" />
         <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
         <div className="text-emerald-500 font-bold tracking-[0.5em] animate-pulse text-xs font-tech">ARGON SYSTEM LOADING...</div>
       </div>
     );
  }

  const hasProfile = !!appState.profile;

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculator" element={<PlateCalculator />} />
          
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/license" element={<License />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/status" element={<SystemStatus />} />

          <Route 
            path="/auth" 
            element={hasProfile ? <Navigate to="/" /> : <Onboarding onComplete={handleAuthComplete} />} 
          />

          <Route path="/subscription" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <Subscription />
            </ProtectedRoute>
          } />

          <Route path="/routines" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <Routines />
            </ProtectedRoute>
          } />
          <Route path="/nutrition" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <Nutrition />
            </ProtectedRoute>
          } />
          <Route path="/routine/:id" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <RoutineDetail />
            </ProtectedRoute>
          } />
          <Route path="/workout" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <Workout />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <History />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <CalendarView />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute hasProfile={hasProfile}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
