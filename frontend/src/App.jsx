import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import CustomerPage from './pages/CustomerPage';
import AdminPage from './pages/AdminPage';
import ChatWidget from './components/ChatWidget';

function AppInner() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('Reservations');

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {!user   && <AuthPage />}
        {user && !isAdmin && (
          <>
            <CustomerPage activeTab={activeTab} />
            <ChatWidget />
          </>
        )}
        {user && isAdmin && <div className="page-container"><AdminPage activeTab={activeTab} /></div>}
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}
