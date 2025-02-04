import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import './LoginPage.css';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');  // Will store either username or email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();  // Add this line to get login function from context

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');  // Clear any previous errors
        
        try {
            await login(username, password);  // Use the context login function
            navigate('/notes', { replace: true });  // Add replace: true to prevent going back to login
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err?.response?.data?.message || 'Invalid username/email or password');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Login to Notepad+</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username or Email</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                <div className="auth-links">
                    <p>Don't have an account? <Link to="/register">Register here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 