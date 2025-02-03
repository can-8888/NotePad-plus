import React from 'react';
import { Note } from '../types/Note';
import './NoteCard.css';
import { NoteStatus } from '../types/Note';

interface NoteCardProps {
    note: Note;
    onDelete: (id: number) => void;
    onShare: (id: number) => void;
    onMakePublic: (id: number) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onShare, onMakePublic }) => {
    return (
        <div className="note-card">
            <div className="note-header">
                <div className="note-title">
                    <h3>{note.title}</h3>
                    <div className="note-meta">
                        <span className="note-author">by {note.owner?.username}</span>
                        {note.status === NoteStatus.Shared && <span className="note-status shared">Shared</span>}
                        {note.status === NoteStatus.Public && <span className="note-status public">Public</span>}
                    </div>
                </div>
                <div className="note-actions">
                    <button onClick={() => onDelete(note.id)} className="delete-btn">
                        Delete
                    </button>
                    <button onClick={() => onShare(note.id)} className="share-btn">
                        Share
                    </button>
                    {note.status !== 'Public' && (
                        <button onClick={() => onMakePublic(note.id)} className="public-btn">
                            Make Public
                        </button>
                    )}
                </div>
            </div>
            <div className="note-content">
                <p>{note.content}</p>
            </div>
            {note.category && (
                <div className="note-footer">
                    <span className="note-category">Category: {note.category}</span>
                </div>
            )}
        </div>
    );
};

export default NoteCard; 