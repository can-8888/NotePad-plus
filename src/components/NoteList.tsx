import React from 'react';
import { Note, NoteStatus } from '../types/Note';
import './NoteList.css';

interface NoteListProps {
    notes: Note[];
    selectedNote?: Note;
    onNoteSelect: (note: Note) => void;
    onDeleteNote: (noteId: number) => void;
    onMakePublic: (noteId: number) => void;
    onShare: (noteId: number) => void;
    viewType?: string;
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
    // Add debug logging
    console.log('NoteList render:', {
        notesCount: notes.length,
        notes,
        isLoading,
        error
    });

    // Helper function to get status class name
    const getStatusClassName = (status: NoteStatus, isPublic: boolean): string => {
        if (isPublic) return 'public';
        return status.toLowerCase();
    };

    // Helper function to get status text
    const getStatusText = (status: NoteStatus, isPublic: boolean): string => {
        if (isPublic) return 'Public';
        switch (status) {
            case NoteStatus.Shared:
                return 'Shared';
            case NoteStatus.Personal:
                return 'Personal';
            default:
                return 'Personal';
        }
    };

    const handleMakePublic = (noteId: number) => {
        console.log('Make public clicked for note:', noteId);
        console.log('Note details:', notes.find(n => n.id === noteId));
        onMakePublic(noteId);
    };

    if (isLoading) {
        console.log('Loading state');
        return <div>Loading...</div>;
    }
    if (error) {
        console.log('Error state:', error);
        return <div className="error">{error}</div>;
    }
    if (notes.length === 0) {
        console.log('No notes state');
        return <div className="no-notes-message">No notes found</div>;
    }

    return (
        <div className="notes-grid">
            {notes.map((note) => (
                <div 
                    key={note.id} 
                    className={`note-card ${selectedNote?.id === note.id ? 'selected' : ''}`}
                >
                    <div className="note-header">
                        <h3 className="note-title">{note.title}</h3>
                        {note.owner && (
                            <div className="note-owner">
                                by {note.owner.username}
                            </div>
                        )}
                    </div>
                    
                    <div className="note-right-content">
                        <span className={`note-status ${getStatusClassName(note.status, note.isPublic)}`}>
                            {getStatusText(note.status, note.isPublic)}
                        </span>
                        <div className="note-actions">
                            <button className="delete-button" onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                            }}>
                                Delete
                            </button>
                            <button className="share-button" onClick={(e) => {
                                e.stopPropagation();
                                onShare(note.id);
                            }}>
                                Share
                            </button>
                            {note.status !== NoteStatus.Public && (
                                <button className="public-button" onClick={(e) => {
                                    e.stopPropagation();
                                    handleMakePublic(note.id);
                                }}>
                                    Make Public
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="note-content" onClick={() => onNoteSelect(note)}>
                        <p>{note.content}</p>
                    </div>
                    
                    <div className="note-metadata">
                        <div>Category: {note.category || 'Uncategorized'}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NoteList;