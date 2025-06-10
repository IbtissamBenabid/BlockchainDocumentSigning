
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextProps {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
}

// Mock user data for demo purposes
const mockUser: User = {
  id: '1',
  email: 'demo@example.com',
  name: 'Demo User',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser) as User;
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  // In a real app, this would make an API call
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock validation (in real app, this would come from backend)
      if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
        localStorage.setItem('user', JSON.stringify(mockUser));
        setAuthState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        });
        toast.success('Welcome back!');
        return true;
      }
      
      toast.error('Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    }
  };

  // In a real app, this would make an API call
  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock registration (in real app, this would be handled by backend)
      const newUser: User = {
        id: Date.now().toString(),
        email: credentials.email,
        name: credentials.name,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem('user', JSON.stringify(newUser));
      setAuthState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
