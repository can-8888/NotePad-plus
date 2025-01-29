import React, { useState } from 'react';
import { api } from '../services/api';
import './ShareNoteDialog.css';

interface ShareNoteDialogProps {
    noteId: number;
    onClose: () => void;
}

export const ShareNoteDialog: React.FC<ShareNoteDialogProps> = ({ noteId, onClose }) => {
    const [collaboratorId, setCollaboratorId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleShare = async () => {
        try {
            await api.shareNote(noteId, parseInt(collaboratorId));
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
                <input
                    type="number"
                    placeholder="Enter collaborator ID"
                    value={collaboratorId}
                    onChange={(e) => setCollaboratorId(e.target.value)}
                />
                <div className="button-group">
                    <button onClick={handleShare}>Share</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}; 