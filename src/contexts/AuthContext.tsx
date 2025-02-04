import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse } from '../types/Auth';
import { api } from '../services/api';
import axios from 'axios';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isInitialized: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    register: (username: string, email: string, password: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Initialize auth state once on mount
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error('Error initializing auth state:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setIsInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    // Set up axios interceptor
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            (config) => {
                if (token && config.headers) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [token]);

    // Sync user to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    // Don't render anything until we've initialized
    if (!isInitialized) {
        return <div>Loading...</div>;
    }

    const login = async (username: string, password: string) => {
        try {
            const response = await api.login({ username, password });
            console.log('Login response:', response);
            
            if (!response.user || !response.token) {
                throw new Error('Invalid response format');
            }

            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string, name?: string) => {
        try {
            const response = await api.register({ username, email, password, name });
            // Set user and token from registration response
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, isInitialized, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};