import { createContext, useContext, useState, useCallback } from 'react';
import { Auth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    Auth.isLoggedIn()
      ? { username: Auth.getUsername(), role: Auth.getRole(), token: Auth.getToken() }
      : null
  );

  const login = useCallback((token, username, role) => {
    Auth.setSession(token, username, role);
    setUser({ token, username, role });
  }, []);

  const logout = useCallback(() => {
    Auth.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
//dummy comment