import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';  // Make sure this exists

const Sidebar: React.FC = () => {
    return (
        <nav className="sidebar">
            <div className="sidebar-content">
                <div className="create-note-container">
                    <NavLink to="/notes/new" className="create-note-button">
                        Create New Note
                    </NavLink>
                </div>
                <div className="nav-section">
                    <NavLink 
                        to="/notes" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">📁</span>
                        My Notes
                    </NavLink>
                    
                    <NavLink 
                        to="/notes/shared" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">🔄</span>
                        Shared Notes
                    </NavLink>
                    
                    <NavLink 
                        to="/notes/public" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">🌐</span>
                        Public Notes
                    </NavLink>
                    
                    <NavLink 
                        to="/drive" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">💾</span>
                        My Drive
                    </NavLink>
                </div>
            </div>
        </nav>
    );
};

export default Sidebar; 