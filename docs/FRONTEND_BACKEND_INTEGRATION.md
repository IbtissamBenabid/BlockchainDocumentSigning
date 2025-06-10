# 🔗 Frontend-Backend Integration Guide

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Client Setup](#api-client-setup)
3. [Authentication Integration](#authentication-integration)
4. [Service Integration Patterns](#service-integration-patterns)
5. [Error Handling](#error-handling)
6. [File Upload Integration](#file-upload-integration)
7. [Real-time Features](#real-time-features)
8. [Testing Integration](#testing-integration)
9. [Performance Optimization](#performance-optimization)
10. [Security Best Practices](#security-best-practices)

## 🏗️ Architecture Overview

### Backend Microservices
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Nginx Gateway  │    │  Microservices  │
│   React App     │◄──►│   Port 80       │◄──►│   Ports 3001-   │
│   Port 3000     │    │                 │    │   3006, 8500    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Endpoints
- **Auth Service**: `http://localhost/api/auth/*` (Port 3001)
- **Document Service**: `http://localhost/api/documents/*` (Port 3002)
- **Signature Service**: `http://localhost/api/signatures/*` (Port 3003)
- **Email Service**: `http://localhost/api/email/*` (Port 3004)
- **Profile Service**: `http://localhost/api/profiles/*` (Port 3005)
- **Blockchain Service**: `http://localhost/api/blockchain/*` (Port 3006)
- **AI Service**: `http://localhost/api/ai/*` (Port 8500)

## 🔧 API Client Setup

### 1. Install Dependencies

```bash
npm install axios @tanstack/react-query
```

### 2. Create API Client Configuration

```typescript
// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { token } = response.data.data;
          localStorage.setItem('authToken', token);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Generic API request function
export async function apiRequest<T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error: any) {
    throw {
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data?.error || 'NETWORK_ERROR',
      status: error.response?.status
    };
  }
}
```

### 3. Environment Configuration

```bash
# .env.local
REACT_APP_API_URL=http://localhost
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

## 🔐 Authentication Integration

### 1. Auth Service Integration

```typescript
// src/services/authService.ts
import { apiRequest, ApiResponse } from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export class AuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/api/auth/login',
      data: credentials
    });
  }

  // Register user
  static async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User }>> {
    return apiRequest<{ user: User }>({
      method: 'POST',
      url: '/api/auth/register',
      data: credentials
    });
  }

  // Refresh token
  static async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    return apiRequest<{ token: string }>({
      method: 'POST',
      url: '/api/auth/refresh',
      data: { refreshToken }
    });
  }

  // Logout
  static async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Get current user
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}
```

### 2. Auth Context Provider

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User, LoginCredentials, RegisterCredentials } from '@/services/authService';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = AuthService.getCurrentUser();
        
        if (token && user) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await AuthService.login(credentials);
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // Store tokens and user data
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast.success('Welcome back!');
        return true;
      }
      
      toast.error(response.message || 'Login failed');
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return false;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      const response = await AuthService.register(credentials);
      
      if (response.success) {
        toast.success('Registration successful! Please log in.');
        return true;
      }
      
      toast.error(response.message || 'Registration failed');
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    AuthService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success('Logged out successfully');
  };

  const refreshAuth = async () => {
    try {
      const user = AuthService.getCurrentUser();
      const isAuthenticated = AuthService.isAuthenticated();
      
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated,
      }));
    } catch (error) {
      console.error('Auth refresh error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        refreshAuth,
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
```

## 📄 Service Integration Patterns

### 1. Document Service Integration

```typescript
// src/services/documentService.ts
import { apiRequest, ApiResponse } from '@/lib/api';

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'SIGNED' | 'VERIFIED' | 'SHARED';
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  hash: string;
  hashAlgorithm: string;
  blockchainTxId?: string;
  pageCount?: number;
  createdAt: string;
  aiAnalysis?: {
    result: 'Benign' | 'Malicious' | 'Suspicious';
    confidence: number;
    riskScore: number;
    timestamp: string;
  };
}

export interface DocumentUploadData {
  title: string;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  signaturesRequired?: number;
}

export class DocumentService {
  // Upload document
  static async uploadDocument(
    file: File,
    data: DocumentUploadData
  ): Promise<ApiResponse<{ document: Document; aiAnalysis?: any }>> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', data.title);
    formData.append('securityLevel', data.securityLevel || 'MEDIUM');
    if (data.signaturesRequired) {
      formData.append('signaturesRequired', data.signaturesRequired.toString());
    }

    return apiRequest<{ document: Document; aiAnalysis?: any }>({
      method: 'POST',
      url: '/api/documents/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get documents list
  static async getDocuments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ documents: Document[]; pagination: any }>> {
    return apiRequest<{ documents: Document[]; pagination: any }>({
      method: 'GET',
      url: '/api/documents',
      params,
    });
  }

  // Get document by ID
  static async getDocument(documentId: string): Promise<ApiResponse<{ document: Document }>> {
    return apiRequest<{ document: Document }>({
      method: 'GET',
      url: `/api/documents/${documentId}`,
    });
  }

  // Update document
  static async updateDocument(
    documentId: string,
    updates: Partial<DocumentUploadData>
  ): Promise<ApiResponse<{ document: Document }>> {
    return apiRequest<{ document: Document }>({
      method: 'PUT',
      url: `/api/documents/${documentId}`,
      data: updates,
    });
  }

  // Delete document
  static async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/documents/${documentId}`,
    });
  }

  // Get AI analysis for document
  static async getAIAnalysis(documentId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>({
      method: 'GET',
      url: `/api/documents/${documentId}/ai-analysis`,
    });
  }

  // Trigger new AI analysis
  static async triggerAIAnalysis(documentId: string): Promise<ApiResponse<any>> {
    return apiRequest<any>({
      method: 'POST',
      url: `/api/documents/${documentId}/ai-analysis`,
    });
  }

  // Download document
  static getDownloadUrl(documentId: string): string {
    return `/api/documents/${documentId}/download`;
  }
}
```

### 2. Signature Service Integration

```typescript
// src/services/signatureService.ts
import { apiRequest, ApiResponse } from '@/lib/api';

export interface Signature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signatureType: 'ELECTRONIC' | 'DIGITAL' | 'BIOMETRIC';
  signatureData: string;
  signatureHash: string;
  metadata?: {
    location?: string;
    reason?: string;
    ipAddress?: string;
    deviceInfo?: string;
  };
  signedAt: string;
}

export interface SignDocumentData {
  signatureType: 'ELECTRONIC' | 'DIGITAL' | 'BIOMETRIC';
  signatureData: string; // Base64 encoded signature
  metadata?: {
    location?: string;
    reason?: string;
  };
}

export class SignatureService {
  // Sign document
  static async signDocument(
    documentId: string,
    signatureData: SignDocumentData
  ): Promise<ApiResponse<{ signature: Signature }>> {
    return apiRequest<{ signature: Signature }>({
      method: 'POST',
      url: `/api/signatures/${documentId}/sign`,
      data: signatureData,
    });
  }

  // Get document signatures
  static async getDocumentSignatures(
    documentId: string
  ): Promise<ApiResponse<{ signatures: Signature[] }>> {
    return apiRequest<{ signatures: Signature[] }>({
      method: 'GET',
      url: `/api/signatures/document/${documentId}`,
    });
  }

  // Verify signature
  static async verifySignature(
    signatureId: string
  ): Promise<ApiResponse<{ isValid: boolean; details: any }>> {
    return apiRequest<{ isValid: boolean; details: any }>({
      method: 'POST',
      url: `/api/signatures/${signatureId}/verify`,
    });
  }

  // Upload signature image
  static async uploadSignatureImage(
    documentId: string,
    signatureFile: File
  ): Promise<ApiResponse<{ signature: Signature }>> {
    const formData = new FormData();
    formData.append('signature', signatureFile);

    return apiRequest<{ signature: Signature }>({
      method: 'POST',
      url: `/api/signatures/${documentId}/upload-signature`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}
```

### 3. Profile Service Integration

```typescript
// src/services/profileService.ts
import { apiRequest, ApiResponse } from '@/lib/api';

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  notificationPreferences?: {
    emailNotifications: boolean;
    documentShared: boolean;
    documentSigned: boolean;
    securityAlerts: boolean;
  };
  privacySettings?: {
    profileVisibility: 'PUBLIC' | 'PRIVATE';
    showEmail: boolean;
    showPhone: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
  website?: string;
  notificationPreferences?: UserProfile['notificationPreferences'];
  privacySettings?: UserProfile['privacySettings'];
}

export class ProfileService {
  // Get user profile
  static async getProfile(): Promise<ApiResponse<{ profile: UserProfile }>> {
    return apiRequest<{ profile: UserProfile }>({
      method: 'GET',
      url: '/api/profiles/me',
    });
  }

  // Update user profile
  static async updateProfile(
    updates: UpdateProfileData
  ): Promise<ApiResponse<{ profile: UserProfile }>> {
    return apiRequest<{ profile: UserProfile }>({
      method: 'PUT',
      url: '/api/profiles/me',
      data: updates,
    });
  }

  // Upload avatar
  static async uploadAvatar(
    avatarFile: File
  ): Promise<ApiResponse<{ profile: UserProfile }>> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    return apiRequest<{ profile: UserProfile }>({
      method: 'POST',
      url: '/api/profiles/avatar',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Delete avatar
  static async deleteAvatar(): Promise<ApiResponse<{ profile: UserProfile }>> {
    return apiRequest<{ profile: UserProfile }>({
      method: 'DELETE',
      url: '/api/profiles/avatar',
    });
  }
}
```

### 4. React Query Integration

```typescript
// src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService, Document, DocumentUploadData } from '@/services/documentService';
import { toast } from 'sonner';

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: any) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  aiAnalysis: (id: string) => [...documentKeys.detail(id), 'ai-analysis'] as const,
};

// Get documents list
export const useDocuments = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => DocumentService.getDocuments(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
};

// Get single document
export const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => DocumentService.getDocument(documentId),
    enabled: !!documentId,
    select: (data) => data.data?.document,
  });
};

// Upload document mutation
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: DocumentUploadData }) =>
      DocumentService.uploadDocument(file, data),
    onSuccess: (response) => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      if (response.success) {
        toast.success('Document uploaded successfully!');

        // Show AI analysis result if available
        if (response.data?.aiAnalysis) {
          const { result, riskScore } = response.data.aiAnalysis;
          if (result === 'Malicious') {
            toast.error(`Security Alert: Malicious content detected!`);
          } else {
            toast.info(`AI Security Scan: ${result} (${riskScore}% risk)`);
          }
        }
      }
    },
    onError: (error: any) => {
      if (error.error === 'MALWARE_DETECTED') {
        toast.error('Upload rejected: Security threat detected in document');
      } else {
        toast.error(error.message || 'Upload failed');
      }
    },
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => DocumentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });
};

// AI Analysis hooks
export const useAIAnalysis = (documentId: string) => {
  return useQuery({
    queryKey: documentKeys.aiAnalysis(documentId),
    queryFn: () => DocumentService.getAIAnalysis(documentId),
    enabled: !!documentId,
    select: (data) => data.data,
  });
};

export const useTriggerAIAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => DocumentService.triggerAIAnalysis(documentId),
    onSuccess: (response, documentId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.aiAnalysis(documentId) });
      if (response.success) {
        toast.success('AI analysis completed');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'AI analysis failed');
    },
  });
};
```

## 🚨 Error Handling

### 1. Global Error Handler

```typescript
// src/lib/errorHandler.ts
export interface ApiError {
  success: false;
  message: string;
  error: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: ApiError | Error): void {
    console.error('API Error:', error);

    if ('error' in error) {
      // API Error
      switch (error.error) {
        case 'VALIDATION_ERROR':
          toast.error(`Validation Error: ${error.message}`);
          break;
        case 'UNAUTHORIZED':
          toast.error('Please log in to continue');
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'FORBIDDEN':
          toast.error('You do not have permission to perform this action');
          break;
        case 'NOT_FOUND':
          toast.error('The requested resource was not found');
          break;
        case 'MALWARE_DETECTED':
          toast.error('Security threat detected in uploaded file');
          break;
        case 'FILE_TOO_LARGE':
          toast.error('File size exceeds the maximum limit');
          break;
        case 'INVALID_FILE_TYPE':
          toast.error('Invalid file type. Please upload a supported format');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          toast.error('Too many requests. Please try again later');
          break;
        case 'NETWORK_ERROR':
          toast.error('Network error. Please check your connection');
          break;
        default:
          toast.error(error.message || 'An unexpected error occurred');
      }
    } else {
      // Generic Error
      toast.error(error.message || 'An unexpected error occurred');
    }
  }

  static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'success' in error && !error.success;
  }
}
```

### 2. Error Boundary Component

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Log to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <Button onClick={this.handleRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded-lg max-w-2xl">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 📁 File Upload Integration

### 1. File Upload Component

```typescript
// src/components/FileUpload.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUploadDocument } from '@/hooks/useDocuments';

interface FileUploadProps {
  onUploadComplete?: (document: any) => void;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [securityLevel, setSecurityLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const uploadMutation = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    try {
      const response = await uploadMutation.mutateAsync({
        file: selectedFile,
        data: {
          title: title.trim(),
          securityLevel
        }
      });

      if (response.success) {
        onUploadComplete?.(response.data?.document);
        // Reset form
        setSelectedFile(null);
        setTitle('');
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setTitle('');
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to select a file
          </p>
          <p className="text-xs text-gray-400">
            Supported formats: {acceptedTypes.join(', ')} • Max size: {formatFileSize(maxSize)}
          </p>
        </div>
      )}

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-sm font-medium text-red-800">File Upload Error</h3>
          </div>
          <ul className="mt-2 text-sm text-red-700">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}: {errors.map(e => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected file */}
      {selectedFile && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <File className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              disabled={uploadMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document title"
                disabled={uploadMutation.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Level
              </label>
              <select
                value={securityLevel}
                onChange={(e) => setSecurityLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploadMutation.isPending}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Upload progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload button */}
            <Button
              onClick={handleUpload}
              disabled={!title.trim() || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. File Upload with Progress Tracking

```typescript
// src/hooks/useFileUpload.ts
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseFileUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  });

  const upload = useCallback(async (file: File, endpoint: string, additionalData?: Record<string, any>) => {
    setIsUploading(true);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add additional data
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentage = total ? Math.round((loaded * 100) / total) : 0;

          const progressData = { loaded, total: total || 0, percentage };
          setProgress(progressData);
          options.onProgress?.(progressData);
        },
      });

      options.onSuccess?.(response.data);
      return response.data;
    } catch (error) {
      options.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  return {
    upload,
    isUploading,
    progress,
  };
};
```

## 🧪 Testing Integration

### 1. API Service Tests

```typescript
// src/services/__tests__/documentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '../documentService';
import { apiRequest } from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

const mockApiRequest = vi.mocked(apiRequest);

describe('DocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockData = { title: 'Test Document', securityLevel: 'MEDIUM' as const };
      const mockResponse = {
        success: true,
        data: {
          document: {
            id: '123',
            title: 'Test Document',
            fileName: 'test.pdf',
            fileType: 'application/pdf',
            status: 'UPLOADED'
          }
        }
      };

      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await DocumentService.uploadDocument(mockFile, mockData);

      expect(mockApiRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/documents/upload',
        data: expect.any(FormData),
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockData = { title: 'Test Document', securityLevel: 'MEDIUM' as const };
      const mockError = {
        success: false,
        message: 'Upload failed',
        error: 'NETWORK_ERROR'
      };

      mockApiRequest.mockRejectedValue(mockError);

      await expect(DocumentService.uploadDocument(mockFile, mockData)).rejects.toEqual(mockError);
    });
  });

  describe('getDocuments', () => {
    it('should fetch documents list', async () => {
      const mockResponse = {
        success: true,
        data: {
          documents: [
            { id: '1', title: 'Doc 1' },
            { id: '2', title: 'Doc 2' }
          ],
          pagination: { page: 1, limit: 10, total: 2 }
        }
      };

      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await DocumentService.getDocuments({ page: 1, limit: 10 });

      expect(mockApiRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/documents',
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
```

### 2. React Hook Tests

```typescript
// src/hooks/__tests__/useDocuments.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocuments, useUploadDocument } from '../useDocuments';
import { DocumentService } from '@/services/documentService';

// Mock the service
vi.mock('@/services/documentService');
const mockDocumentService = vi.mocked(DocumentService);

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch documents successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        documents: [{ id: '1', title: 'Test Doc' }],
        pagination: { page: 1, limit: 10, total: 1 }
      }
    };

    mockDocumentService.getDocuments.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse.data);
    expect(mockDocumentService.getDocuments).toHaveBeenCalledWith(undefined);
  });
});

describe('useUploadDocument', () => {
  it('should upload document successfully', async () => {
    const mockResponse = {
      success: true,
      data: { document: { id: '1', title: 'Test Doc' } }
    };

    mockDocumentService.uploadDocument.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUploadDocument(), {
      wrapper: createWrapper(),
    });

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const mockData = { title: 'Test Document', securityLevel: 'MEDIUM' as const };

    await waitFor(() => {
      result.current.mutate({ file: mockFile, data: mockData });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(mockFile, mockData);
  });
});
```

### 3. Integration Tests

```typescript
// src/__tests__/integration/documentFlow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { DocumentService } from '@/services/documentService';

// Mock server setup
const server = setupServer(
  rest.post('http://localhost/api/documents/upload', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          document: {
            id: 'test-doc-id',
            title: 'Test Document',
            fileName: 'test.pdf',
            fileType: 'application/pdf',
            status: 'UPLOADED'
          },
          aiAnalysis: {
            result: 'Benign',
            confidence: 0.95,
            riskScore: 5
          }
        }
      })
    );
  }),

  rest.get('http://localhost/api/documents', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          documents: [
            {
              id: 'test-doc-id',
              title: 'Test Document',
              status: 'UPLOADED'
            }
          ],
          pagination: { page: 1, limit: 10, total: 1 }
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Document Flow Integration', () => {
  it('should complete full document upload and retrieval flow', async () => {
    // 1. Upload document
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadResponse = await DocumentService.uploadDocument(mockFile, {
      title: 'Test Document',
      securityLevel: 'MEDIUM'
    });

    expect(uploadResponse.success).toBe(true);
    expect(uploadResponse.data?.document.title).toBe('Test Document');
    expect(uploadResponse.data?.aiAnalysis.result).toBe('Benign');

    // 2. Fetch documents list
    const documentsResponse = await DocumentService.getDocuments();

    expect(documentsResponse.success).toBe(true);
    expect(documentsResponse.data?.documents).toHaveLength(1);
    expect(documentsResponse.data?.documents[0].title).toBe('Test Document');
  });
});
```

## ⚡ Performance Optimization

### 1. Query Optimization

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time - how long data stays in cache after becoming unused
      cacheTime: 10 * 60 * 1000, // 10 minutes

      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prefetch commonly used data
export const prefetchCommonData = async () => {
  // Prefetch user profile
  await queryClient.prefetchQuery({
    queryKey: ['profile'],
    queryFn: () => ProfileService.getProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Prefetch recent documents
  await queryClient.prefetchQuery({
    queryKey: ['documents', { page: 1, limit: 10 }],
    queryFn: () => DocumentService.getDocuments({ page: 1, limit: 10 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

### 2. Request Optimization

```typescript
// src/lib/requestOptimization.ts
import { apiClient } from './api';

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// Request batching for multiple document operations
export class BatchRequestManager {
  private batchQueue: Array<{
    id: string;
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms

  addToBatch<T>(id: string, request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ id, request, resolve, reject });

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    });
  }

  private async processBatch() {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Group similar requests
    const groupedRequests = batch.reduce((groups, item) => {
      const key = item.id.split(':')[0]; // Group by operation type
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, typeof batch>);

    // Process each group
    for (const [key, requests] of Object.entries(groupedRequests)) {
      if (key === 'documents' && requests.length > 1) {
        // Batch document requests
        await this.batchDocumentRequests(requests);
      } else {
        // Process individual requests
        await Promise.allSettled(
          requests.map(async ({ request, resolve, reject }) => {
            try {
              const result = await request();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          })
        );
      }
    }
  }

  private async batchDocumentRequests(requests: any[]) {
    try {
      // Extract document IDs
      const documentIds = requests.map(req => req.id.split(':')[1]);

      // Make batch request
      const response = await apiClient.post('/api/documents/batch', {
        documentIds,
        operations: requests.map(req => req.id.split(':')[0])
      });

      // Resolve individual promises
      requests.forEach((req, index) => {
        req.resolve(response.data.results[index]);
      });
    } catch (error) {
      // Reject all promises
      requests.forEach(req => req.reject(error));
    }
  }
}

export const batchManager = new BatchRequestManager();
```

## 🔒 Security Best Practices

### 1. Token Management

```typescript
// src/lib/tokenManager.ts
export class TokenManager {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';

  // Store token securely
  static setToken(token: string, expiresIn: number = 24 * 60 * 60 * 1000): void {
    const expiry = Date.now() + expiresIn;

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
  }

  static setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return null;

    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      this.clearTokens();
      return null;
    }

    return token;
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    return Date.now() > parseInt(expiry);
  }

  // Auto-refresh token before expiry
  static scheduleTokenRefresh(refreshCallback: () => Promise<void>): void {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return;

    const timeUntilExpiry = parseInt(expiry) - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // 5 minutes before expiry

    setTimeout(async () => {
      try {
        await refreshCallback();
        // Schedule next refresh
        this.scheduleTokenRefresh(refreshCallback);
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.clearTokens();
        window.location.href = '/login';
      }
    }, refreshTime);
  }
}
```

### 2. Input Validation and Sanitization

```typescript
// src/lib/validation.ts
import DOMPurify from 'dompurify';

export class ValidationUtils {
  // Sanitize HTML content
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Validate file types
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(fileExtension);
  }

  // Validate file size
  static validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize user input
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
}
```

### 3. CSRF Protection

```typescript
// src/lib/csrfProtection.ts
export class CSRFProtection {
  private static readonly CSRF_TOKEN_KEY = 'csrfToken';

  // Get CSRF token from meta tag or API
  static async getCSRFToken(): Promise<string> {
    // First try to get from meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;

    // Otherwise fetch from API
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      throw new Error('CSRF token unavailable');
    }
  }

  // Add CSRF token to request headers
  static async addCSRFHeader(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    try {
      const token = await this.getCSRFToken();
      return {
        ...headers,
        'X-CSRF-Token': token
      };
    } catch (error) {
      console.warn('CSRF token not available:', error);
      return headers;
    }
  }
}
```

## 🔄 Real-time Features

### 1. WebSocket Integration

```typescript
// src/lib/websocket.ts
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = TokenManager.getToken();
        const wsUrl = `${this.url}?token=${token}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any): void {
    const { type, payload } = data;
    const listeners = this.listeners.get(type);

    if (listeners) {
      listeners.forEach(listener => listener(payload));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// WebSocket hook
export const useWebSocket = (url: string) => {
  const [wsManager] = useState(() => new WebSocketManager(url));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    wsManager.connect()
      .then(() => setIsConnected(true))
      .catch(error => {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      });

    return () => {
      wsManager.disconnect();
      setIsConnected(false);
    };
  }, [wsManager]);

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    return wsManager.subscribe(eventType, callback);
  }, [wsManager]);

  const send = useCallback((type: string, payload: any) => {
    wsManager.send(type, payload);
  }, [wsManager]);

  return { isConnected, subscribe, send };
};
```

### 2. Real-time Document Updates

```typescript
// src/hooks/useRealTimeDocuments.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/lib/websocket';
import { documentKeys } from './useDocuments';

export const useRealTimeDocuments = () => {
  const queryClient = useQueryClient();
  const { isConnected, subscribe } = useWebSocket(
    process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws'
  );

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to document events
    const unsubscribeDocumentUpdated = subscribe('document:updated', (data) => {
      // Update specific document in cache
      queryClient.setQueryData(
        documentKeys.detail(data.documentId),
        (oldData: any) => ({
          ...oldData,
          data: { document: data.document }
        })
      );

      // Invalidate documents list
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    });

    const unsubscribeDocumentSigned = subscribe('document:signed', (data) => {
      // Update document status
      queryClient.setQueryData(
        documentKeys.detail(data.documentId),
        (oldData: any) => ({
          ...oldData,
          data: {
            document: {
              ...oldData?.data?.document,
              status: 'SIGNED'
            }
          }
        })
      );

      // Show notification
      toast.success(`Document "${data.documentTitle}" has been signed`);
    });

    const unsubscribeDocumentShared = subscribe('document:shared', (data) => {
      toast.info(`Document "${data.documentTitle}" has been shared with you`);

      // Refetch documents list to include new shared document
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeDocumentUpdated();
      unsubscribeDocumentSigned();
      unsubscribeDocumentShared();
    };
  }, [isConnected, subscribe, queryClient]);

  return { isConnected };
};
```

## 📚 Quick Reference

### Common API Patterns

```typescript
// Authentication
const { login, logout, authState } = useAuth();
await login({ email, password });

// Document operations
const { data: documents } = useDocuments({ page: 1, limit: 10 });
const uploadMutation = useUploadDocument();
await uploadMutation.mutateAsync({ file, data: { title, securityLevel } });

// Error handling
try {
  const result = await DocumentService.uploadDocument(file, data);
} catch (error) {
  ErrorHandler.handle(error);
}

// File validation
const isValidFile = ValidationUtils.validateFileType(file, ['.pdf', '.doc']);
const isValidSize = ValidationUtils.validateFileSize(file, 50 * 1024 * 1024);
```

### Environment Variables

```bash
# Frontend .env.local
REACT_APP_API_URL=http://localhost
REACT_APP_WS_URL=ws://localhost:3001/ws
REACT_APP_ENVIRONMENT=development
REACT_APP_MAX_FILE_SIZE=52428800
REACT_APP_ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.png
```

### Best Practices Summary

1. **Always validate user input** before sending to backend
2. **Use TypeScript** for type safety
3. **Implement proper error handling** with user-friendly messages
4. **Cache API responses** with React Query
5. **Secure token storage** and automatic refresh
6. **Validate file uploads** on both client and server
7. **Use HTTPS** in production
8. **Implement CSRF protection** for state-changing operations
9. **Monitor API performance** and optimize queries
10. **Test integration points** thoroughly

This guide provides a comprehensive foundation for integrating the VerSafe frontend with the microservices backend. Follow these patterns and best practices to build a robust, secure, and performant application.
```
