import React, { useState } from 'react';
import RoleSelectScreen from './screens/RoleSelectScreen';
import AuthScreen from './screens/AuthScreen';
import ResidentScreen from './screens/ResidentScreen';
import AdminScreen from './screens/AdminScreen';
import TechnicianScreen from './screens/TechnicianScreen';
import { UserRole } from './types/report';
import { supabase } from './lib/supabase';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticatedRole(null);
    setSelectedRole(null);
  };

  // Render Dashboard after successful authentication
  if (authenticatedRole === 'Resident') {
    return <ResidentScreen onBack={handleLogout} />;
  }

  if (authenticatedRole === 'Admin') {
    return <AdminScreen onBack={handleLogout} />;
  }

  if (authenticatedRole === 'Technician') {
    return <TechnicianScreen onBack={handleLogout} />;
  }

  // Render Login/Signup Screen if a role card was clicked
  if (selectedRole) {
    return (
      <AuthScreen
        initialRole={selectedRole}
        onBack={() => setSelectedRole(null)}
        onLoginSuccess={(role) => setAuthenticatedRole(role)}
      />
    );
  }

  // Render Role Selection Menu by default
  return <RoleSelectScreen onSelectRole={(role) => setSelectedRole(role)} />;
}