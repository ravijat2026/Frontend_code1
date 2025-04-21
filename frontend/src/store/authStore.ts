// src/store/authStore.ts

import { create } from 'zustand';
import { AuthState, RegisterPayload, LoginPayload, User, RegisterResponse, VerifyEmailResponse, LoginResponse, LogoutResponse, ResendOtpResponse } from './authTypes'; // Ensure paths are correct
import apiClient from '../services/apiClient'; // Ensure paths are correct

const getErrorMessage = (error: any): string => {
  if (error.response && error.response.data) {
    if (error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data.error && error.response.data.error.message) {
        return error.response.data.error.message;
    }
     if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
         // Handle array of validation errors from Joi
         if (typeof error.response.data.errors[0] === 'object' && error.response.data.errors[0]?.message) {
             return error.response.data.errors.map((err: { message: string }) => err.message).join(', ');
         }
         // Handle other array formats if necessary, or just return the first item
         return String(error.response.data.errors[0] || 'Validation Error');
    }
    // Handle cases where 'errors' might be an object (less common for Joi array)
    if (typeof error.response.data.errors === 'object' && error.response.data.errors !== null) {
         return JSON.stringify(error.response.data.errors);
    }
  }
  if (error.message) {
      return error.message;
  }
  return 'An unknown error occurred';
};

const clearAuthState = (set: (updater: (state: AuthState) => Partial<AuthState>) => void) => {
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    set(state => ({
        user: null, token: null, isAuthenticated: false, isLoading: false,
        isResendingOtp: false, error: null, userIdForVerification: null,
        requiresVerification: false, isAuthInitialized: true,
    }));
    console.log('Auth state cleared.');
};


export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  user: null, token: null, isAuthenticated: false, isLoading: false,
  isResendingOtp: false, error: null, userIdForVerification: null,
  requiresVerification: false, isAuthInitialized: false,

  // UPDATED: Register action accepts payload with captcha
  register: async (payload: RegisterPayload) => { // Type already includes captcha?
    set({ isLoading: true, isResendingOtp: false, error: null, requiresVerification: false, userIdForVerification: null });
    try {
      // The payload received here should already contain the captcha token from the component
      if (!payload.captcha) {
         // This check might be redundant if component ensures captcha exists, but good defense
         throw new Error('CAPTCHA token is missing in payload');
      }
      const response = await apiClient.post<RegisterResponse>('/users/createUser', payload);
      const userId = response.data.user.id;
      set({
        isLoading: false,
        userIdForVerification: userId,
        requiresVerification: true,
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error("Registration API Error:", error.response?.status, errorMessage);
      set({ isLoading: false, error: errorMessage });
      // Re-throw the error so the component's catch block can handle UI specifics
      throw new Error(errorMessage);
    }
  },

  verifyEmail: async (otpCode: string): Promise<boolean> => {
    const userId = get().userIdForVerification;
    if (!userId) {
      const errorMsg = "User ID for verification not found. Please register again.";
      set({ isLoading: false, error: errorMsg, requiresVerification: false });
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      await apiClient.post<VerifyEmailResponse>('/users/verify-email', { userId, otpCode });
      set({ isLoading: false, userIdForVerification: null, requiresVerification: false });
      return true;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      set({ isLoading: false, error: errorMessage });
      return false;
    }
  },

  resendOtp: async (): Promise<{ success: boolean; message: string; remaining?: number }> => {
    const userId = get().userIdForVerification;
    if (!userId) {
      const errorMsg = "User ID not found. Cannot resend OTP.";
       set({ error: errorMsg });
       return { success: false, message: errorMsg };
    }
    set({ isResendingOtp: true, error: null });
    try {
        const response = await apiClient.post<ResendOtpResponse>('/users/resend-otp', { userId });
        set({ isResendingOtp: false });
        return {
            success: true,
            message: response.data.message || 'Verification code sent successfully',
            remaining: response.data.data?.remainingAttempts
        };
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        set({ isResendingOtp: false, error: errorMessage });
        return { success: false, message: errorMessage };
    }
  },

  // UPDATED: Login action accepts payload with captchaToken
  login: async (payload: LoginPayload) => { // Type already includes captchaToken?
    set({ isLoading: true, isResendingOtp: false, error: null, requiresVerification: false, userIdForVerification: null });
    try {
       if (!payload.captchaToken) {
         throw new Error('CAPTCHA token is missing in payload');
      }
      const response = await apiClient.post<LoginResponse>('/auth/login', payload);
      const { data: userData, token } = response.data;
      // Ensure userData includes necessary fields based on User type
      const user: User = {
          id: userData.id,
          status: userData.status,
          first_name: (userData as any).first_name // Cast or ensure backend sends it consistently
      };
      localStorage.setItem('authToken', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({
        user, token, isAuthenticated: true, isLoading: false, error: null, isAuthInitialized: true,
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error("Login API Error:", error.response?.status, errorMessage);
      clearAuthState(set);
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    const currentToken = get().token;
    console.log("Initiating logout...");
    try {
        if (currentToken) {
             apiClient.post<LogoutResponse>('/auth/logout').catch(err => {
                 console.warn("Backend logout call failed:", err.message);
             });
        }
    } catch (error: any) { console.error("Error during logout request setup:", error); }
    finally { clearAuthState(set); }
  },

  initializeAuth: async () => {
     if (get().isAuthInitialized) return;
     console.log("Initializing authentication...");
     const token = localStorage.getItem('authToken');
     if (token) {
        console.log("Token found. Verifying...");
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            // Adjust User type here if first_name is expected
            const response = await apiClient.get<{status: string; data: User & {first_name?: string} }>('/users/getUserProfile');
            const userProfile = response.data.data;
            if (userProfile && userProfile.status === 'active') {
                console.log("Token verified, user profile fetched:", userProfile);
                // Store necessary user info
                const user: User = { id: userProfile.id, status: userProfile.status, first_name: userProfile.first_name };
                set({ user, token, isAuthenticated: true, isAuthInitialized: true, isLoading: false, error: null });
            } else {
                 console.warn("Token valid but user not active or profile invalid. Logging out.");
                 clearAuthState(set);
            }
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            console.warn("Token verification failed:", error.response?.status, errorMessage);
            clearAuthState(set);
        }
     } else {
        console.log("No token found.");
        clearAuthState(set);
     }
  },

  clearError: () => { set({ error: null }); },

}));