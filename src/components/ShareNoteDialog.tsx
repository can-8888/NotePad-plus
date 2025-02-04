import React, { useState, useEffect } from 'react';
import { User } from '../types/Auth';
import { api, getCurrentUser } from '../services/api';
import './ShareNoteDialog.css';

interface ShareNoteDialogProps {
    noteId: number;
    onShare: (userId: number) => void;
    onClose: () => void;
}

export const ShareNoteDialog: React.FC<ShareNoteDialogProps> = ({ noteId, onShare, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setUsers([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const results = await api.searchUsers(searchTerm);
                console.log('Search results:', results);
                
                const usersList = results.users || [];
                const currentUser = getCurrentUser();
                const filteredUsers = usersList.filter(user => user.id !== currentUser?.id);
                
                setUsers(filteredUsers);
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search users');
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    return (
        <div className="share-dialog">
            <h2>Share Note</h2>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Type at least 2 characters to search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    autoFocus
                />
            </div>
            <div className="users-list">
                {isLoading && <div className="loading">Searching users...</div>}
                {error && <div className="error">{error}</div>}
                {!isLoading && !error && searchTerm.length < 2 && (
                    <div className="search-hint">Type at least 2 characters to search</div>
                )}
                {!isLoading && !error && searchTerm.length >= 2 && users.length === 0 && (
                    <div className="no-results">No users found</div>
                )}
                {users.map(user => (
                    <div key={user.id} className="user-item">
                        <div className="user-info">
                            <span className="username">{user.username}</span>
                            {user.email && <span className="email">{user.email}</span>}
                        </div>
                        <button onClick={() => onShare(user.id)}>Share</button>
                    </div>
                ))}
            </div>
            <div className="dialog-actions">
                <button onClick={onClose} className="cancel-button">Cancel</button>
            </div>
        </div>
    );
}; 