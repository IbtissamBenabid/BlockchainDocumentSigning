import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

const baseUrl = "http://localhost:3001/api/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

interface AuthContextProps {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  refresh: () => Promise<boolean>;
}

interface ApiSuccessResponse {
  success: true;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

interface RegisterSuccessResponse {
  success: true;
  message: string;
  data: {
    user: User;
  };
}

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: { type: string; msg: string; path: string; location: string }[];
}

interface RefreshSuccessResponse {
  success: true;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
  };
}

interface RefreshErrorResponse {
  success: false;
  message: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
    refreshToken: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        const savedRefreshToken = localStorage.getItem('refreshToken');
        if (savedUser && savedToken && savedRefreshToken) {
          const user = JSON.parse(savedUser) as User;
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            token: savedToken,
            refreshToken: savedRefreshToken,
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
      const response = await axios.post<ApiSuccessResponse>(
        `${baseUrl}/login`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { user, token, refreshToken } = response.data.data;

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token,
        refreshToken,
      });

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      toast.success(response.data.message);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.data) {
          const { message, errors } = axiosError.response.data;
          if (errors && errors.length > 0) {
            errors.forEach((err) => toast.error(err.msg));
          } else {
            toast.error(message);
          }
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
      // Attempt registration
      const registerResponse = await axios.post<RegisterSuccessResponse>(
        `${baseUrl}/register`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Registration response:', registerResponse.data);

      // After successful registration, perform login to get tokens
      const loginCredentials: LoginCredentials = {
        email: credentials.email,
        password: credentials.password,
      };

      const loginResponse = await axios.post<ApiSuccessResponse>(
        `${baseUrl}/login`,
        loginCredentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Login response after registration:', loginResponse.data);

      const { user, token, refreshToken } = loginResponse.data.data;

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token,
        refreshToken,
      });

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      toast.success(registerResponse.data.message);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.data) {
          const { message, errors } = axiosError.response.data;
          if (errors && errors.length > 0) {
            errors.forEach((err) => toast.error(err.msg));
          } else {
            toast.error(message);
          }
        } else {
          toast.error('Registration or login failed. Please try again.');
        }
      } else {
        console.error('Registration error:', error);
        toast.error('An unexpected error occurred.');
      }
      return false;
    }
  };

  const refresh = async (): Promise<boolean> => {
    try {
      const savedRefreshToken = localStorage.getItem('refreshToken');
      if (!savedRefreshToken) {
        toast.error('No refresh token available. Please log in again.');
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
        }));
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return false;
      }

      const response = await axios.post<RefreshSuccessResponse>(
        `${baseUrl}/refresh`,
        { refreshToken: savedRefreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { token, refreshToken: newRefreshToken } = response.data.data;

      setAuthState((prev) => ({
        ...prev,
        token,
        refreshToken: newRefreshToken || prev.refreshToken,
      }));

      localStorage.setItem('token', token);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      toast.success(response.data.message);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<RefreshErrorResponse>;
        if (axiosError.response?.data) {
          toast.error(axiosError.response.data.message);
        } else {
          toast.error('Failed to refresh token. Please log in again.');
        }
      } else {
        console.error('Refresh token error:', error);
        toast.error('An unexpected error occurred.');
      }

      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
      }));
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, refresh }}>
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
