import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const handleCreateNote = () => {
        navigate('/notes/new');
    };

    return (
        <nav className="sidebar">
            <button className="create-note-button" onClick={handleCreateNote}>
                Create New Note
            </button>
            <div className="nav-section">
                <div 
                    className="nav-item"
                    onClick={() => navigate('/notes')}
                >
                    <span className="nav-icon">📁</span>
                    My Notes
                </div>
                <div 
                    className="nav-item"
                    onClick={() => navigate('/notes/shared')}
                >
                    <span className="nav-icon">🔄</span>
                    Notes Shared With Me
                </div>
                <div 
                    className="nav-item"
                    onClick={() => navigate('/notes/public')}
                >
                    <span className="nav-icon">🌐</span>
                    Public Notes
                </div>
            </div>
        </nav>
    );
};

export default Sidebar; 