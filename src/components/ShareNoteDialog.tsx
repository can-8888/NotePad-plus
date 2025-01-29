import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types/Note';
import './ShareNoteDialog.css';

interface ShareNoteDialogProps {
    noteId: number;
    onClose: () => void;
    onShare: () => void;
}

export const ShareNoteDialog: React.FC<ShareNoteDialogProps> = ({ noteId, onClose, onShare }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (searchTerm.length < 2) {
                setUsers([]);
                return;
            }

            try {
                setIsSearching(true);
                setError(null);
                console.log('Starting search for term:', searchTerm);
                
                const response = await api.searchUsers(searchTerm);
                console.log('Search completed, response:', response);
                
                if (Array.isArray(response)) {
                    setUsers(response);
                } else {
                    console.error('Invalid response format:', response);
                    setError('Invalid response from server');
                    setUsers([]);
                }
            } catch (err) {
                console.error('Search error:', err);
                setError(err instanceof Error ? err.message : 'Failed to search users');
                setUsers([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleShare = async () => {
        if (!selectedUserId) {
            setError('Please select a user');
            return;
        }

        try {
            setError(null);
            await api.shareNote(noteId, selectedUserId);
            onShare();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to share note');
        }
    };

    return (
        <div className="share-dialog-overlay">
            <div className="share-dialog">
                <h2>Share Note</h2>
                {error && <div className="error-message">{error}</div>}
                
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search users by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="users-list">
                    {isSearching ? (
                        <div className="searching-message">Searching...</div>
                    ) : users.length > 0 ? (
                        users.map(user => (
                            <div
                                key={user.id}
                                className={`user-item ${selectedUserId === user.id ? 'selected' : ''}`}
                                onClick={() => setSelectedUserId(user.id)}
                            >
                                <span className="username">{user.username}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        ))
                    ) : searchTerm.length >= 2 ? (
                        <div className="no-results">No users found</div>
                    ) : (
                        <div className="search-hint">Type at least 2 characters to search</div>
                    )}
                </div>

                <div className="dialog-actions">
                    <button 
                        onClick={handleShare} 
                        disabled={!selectedUserId || isSearching}
                    >
                        Share
                    </button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}; 