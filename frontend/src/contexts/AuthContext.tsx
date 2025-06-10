import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

const baseUrl = "http://localhost/api/auth";

interface AuthContextProps {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
}

interface LoginApiSuccessResponse {
  success: true;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

interface LoginApiErrorResponse {
  success: false;
  message: string;
}

interface RegisterApiSuccessResponse {
  success: true;
  message: string;
  data: {
    user: User;
  };
}

interface RegisterApiErrorResponse {
  success: false;
  message: string;
  errors: {
    type: string;
    msg: string;
    path: string;
    location: string;
  }[];
}

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
        const LoginSavedUser = localStorage.getItem('user');
        const LoginSavedToken = localStorage.getItem('token');
        if (LoginSavedUser && LoginSavedToken) {
          const user = JSON.parse(LoginSavedUser) as User;
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

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Make API call to the backend
      const LoginResponse = await axios.post<LoginApiSuccessResponse>(
        `${baseUrl}/login`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract user and tokens from response
      const { user, token, refreshToken } = LoginResponse.data.data;

      // Update auth state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store user and tokens in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Show success toast
      toast.success(LoginResponse.data.message); // e.g., "Login successful"
      return true;
    } catch (error) {
      // Handle API errors
      if (axios.isAxiosError(error)) {
        const LoginAxiosError = error as AxiosError<LoginApiErrorResponse>;
        if (LoginAxiosError.response?.data) {
          toast.error(LoginAxiosError.response.data.message); // e.g., "Invalid credentials"
        } else {
          toast.error('Login failed. Please try again.');
        }
      } else {
        console.error('Login error:', error);
        toast.error('An unexpected error occurred.');
      }
      return false;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      // Make API call to the backend
      const response = await axios.post<RegisterApiSuccessResponse>(
        `${baseUrl}/register`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract user from response
      const { user } = response.data.data;

      // Update auth state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Show success toast
      toast.success(response.data.message); // e.g., "User registered successfully. Please check your email for verification."
      return true;
    } catch (error) {
      // Handle API errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<RegisterApiErrorResponse>;
        if (axiosError.response?.data) {
          const { message, errors } = axiosError.response.data;
          // Show specific validation errors
          if (errors && errors.length > 0) {
            errors.forEach((err) => {
              toast.error(err.msg); // e.g., "Valid email is required"
            });
          } else {
            toast.error(message); // e.g., "Validation failed"
          }
        } else {
          toast.error('Registration failed. Please try again.');
        }
      } else {
        console.error('Registration error:', error);
        toast.error('An unexpected error occurred.');
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
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