import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Sidebar.css';  // Make sure this exists

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <nav className="sidebar">
            <div className="sidebar-content">
                <div className="create-note-container">
                    <Link to="/notes/new" className="create-note-button">
                        Create New Note
                    </Link>
                </div>
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
                        onClick={() => navigate('/shared-notes')}
                    >
                        <span className="nav-icon">🔄</span>
                        Shared Notes
                    </div>
                    <div 
                        className="nav-item"
                        onClick={() => navigate('/public-notes')}
                    >
                        <span className="nav-icon">🌐</span>
                        Public Notes
                    </div>
                    <div 
                        className="nav-item"
                        onClick={() => navigate('/drive')}
                    >
                        <span className="nav-icon">💾</span>
                        My Drive
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Sidebar; 