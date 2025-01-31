import React from 'react';
import { Note } from '../types/Note';
import { getCurrentUser } from '../services/api';
import './NoteList.css';

interface NoteListProps {
    notes: Note[];
    selectedNote?: Note;
    onNoteSelect: (note: Note) => void;
    onDeleteNote: (noteId: number) => Promise<void>;
    onMakePublic: (noteId: number) => Promise<void>;
    onShare: (noteId: number) => void;
    isLoading?: boolean;
    error?: string | null;
}

const NoteList: React.FC<NoteListProps> = ({
    notes,
    selectedNote,
    onNoteSelect,
    onDeleteNote,
    onMakePublic,
    onShare,
    isLoading,
    error
}) => {
    console.log('NoteList received notes:', notes);

    if (isLoading) {
        return <div className="loading-message">Loading notes...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="note-lists-container">
            {notes.length > 0 ? (
                <div className="notes-grid">
                    {notes.map((note) => (
                        <div 
                            key={note.id} 
                            className={`note-card ${selectedNote?.id === note.id ? 'selected' : ''}`}
                        >
                            <div className="note-content" onClick={() => onNoteSelect(note)}>
                                <h3>{note.title || 'Untitled'}</h3>
                                <p>{note.content ? note.content.substring(0, 100) + '...' : 'No content'}</p>
                                <div className="note-metadata">
                                    <small>Category: {note.category || 'Uncategorized'}</small>
                                    {note.user && <small>By: {note.user.username || note.user.Username}</small>}
                                </div>
                            </div>
                            {/* Only show actions for notes owned by the user */}
                            {note.userId === getCurrentUser()?.Id && !note.isShared && (
                                <div className="note-actions">
                                    <button onClick={() => onDeleteNote(note.id)}>Delete</button>
                                    <button onClick={() => onShare(note.id)}>Share</button>
                                    {!note.isPublic && (
                                        <button onClick={() => onMakePublic(note.id)}>Make Public</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-notes-message">No notes available</p>
            )}
        </div>
    );
};

export default NoteList;