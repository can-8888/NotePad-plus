import React from 'react';
import { Note, NoteStatus, getNoteStatus } from '../types/Note';
import './NoteList.css';

interface NoteListProps {
    notes: Note[];
    selectedNote?: Note;
    onNoteSelect: (note: Note) => void;
    onDeleteNote: (id: number) => void;
    onMakePublic: (id: number) => void;
    onShare: (id: number) => void;
    viewType?: string;
    isLoading?: boolean;
    error?: string | null;
}

const NoteList: React.FC<NoteListProps> = ({ 
    notes, 
    onNoteSelect, 
    onDeleteNote, 
    onMakePublic,
    onShare,
    isLoading,
    error 
}) => {
    // Helper function to get status class name
    const getStatusClassName = (status: NoteStatus): string => {
        switch (status) {
            case NoteStatus.Public:
                return 'public';
            case NoteStatus.Shared:
                return 'shared';
            case NoteStatus.Personal:
                return 'personal';
            default:
                return 'personal';
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="notes-grid">
            {notes.map(note => (
                <div key={note.id} className="note-card">
                    <div className="note-content" onClick={() => onNoteSelect(note)}>
                        <div className="note-header">
                            <h3 className="note-title">{note.title}</h3>
                        </div>
                        <p className="note-preview">{note.content}</p>
                        <div className="note-metadata">
                            <div className="note-category">Category: {note.category}</div>
                            {note.owner && <div className="note-owner">Owner: {note.owner}</div>}
                        </div>
                    </div>
                    
                    <div className="note-actions">
                        <span className={`note-status ${getStatusClassName(note.status)}`}>
                            {NoteStatus[note.status]}
                        </span>
                        <button 
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                            }}
                        >
                            Delete
                        </button>
                        <button 
                            className="share-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare(note.id);
                            }}
                        >
                            Share
                        </button>
                        {note.status !== NoteStatus.Public && (
                            <button 
                                className="public-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Make Public clicked for note:', {
                                        id: note.id,
                                        title: note.title,
                                        status: NoteStatus[note.status],
                                        numericStatus: note.status
                                    });
                                    if (note.id) {
                                        onMakePublic(note.id);
                                    }
                                }}
                            >
                                Make Public
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NoteList;