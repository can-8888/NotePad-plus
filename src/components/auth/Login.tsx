import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            await login(
                formData.get('username') as string,
                formData.get('password') as string
            );
            navigate('/notes');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Autentificare</h2>
            {error && <div className="error-message">{error}</div>}
            <input
                type="text"
                placeholder="Nume utilizator"
                name="username"
                required
            />
            <input
                type="password"
                placeholder="Parolă"
                name="password"
                required
            />
            <button type="submit" disabled={isLoading}>Autentificare</button>
        </form>
    );
};

export default Login;