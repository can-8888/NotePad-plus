import React, { useState } from 'react';
import { Note, NoteStatus, User, getNoteStatus } from '../types/Note';
import Modal from './Modal';
import './NoteStatusIndicator.css';

interface NoteStatusIndicatorProps {
    note: Note;
}

const NoteStatusIndicator: React.FC<NoteStatusIndicatorProps> = ({ note }) => {
    const [showSharedModal, setShowSharedModal] = useState(false);

    const getStatusClassName = (status: NoteStatus): string => {
        return NoteStatus[status].toLowerCase();
    };

    const statusClass = `status-indicator ${getStatusClassName(note.status)}`;

    const getStatusText = () => {
        switch (note.status) {
            case NoteStatus.Public:
                return '🌐 Public';
            case NoteStatus.Shared:
                return '🔄 Shared';
            case NoteStatus.Personal:
                return '🔒 Personal';
            default:
                return '🔒 Personal';
        }
    };

    const handleClick = () => {
        if (note.status === NoteStatus.Shared) {
            setShowSharedModal(true);
        }
    };

    return (
        <>
            <div 
                className={statusClass}
                title={`Status: ${NoteStatus[note.status]}`}
                onClick={handleClick}
                style={{ cursor: note.status === NoteStatus.Shared ? 'pointer' : 'default' }}
            >
                {getStatusText()}
            </div>

            {showSharedModal && (
                <Modal
                    isOpen={showSharedModal}
                    onClose={() => setShowSharedModal(false)}
                    title="Shared With"
                >
                    <div className="shared-users-list">
                        {note.collaborators?.length ? (
                            <ul>
                                {note.collaborators.map((user: User) => (
                                    <li key={user.id}>
                                        <span className="username">{user.username}</span>
                                        <span className="email">({user.email})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No users to display</p>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};

export default NoteStatusIndicator; 