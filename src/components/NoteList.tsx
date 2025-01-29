import React from 'react';
import { Note } from '../types/Note';
import './NoteList.css';

interface NoteListProps {
    notes: Note[];
    sharedNotes: Note[];
    selectedNote?: Note;
    onNoteSelect: (note: Note) => void;
    onDeleteNote: (id: number) => void;
    onMakePublic: (id: number) => void;
    onShare: (id: number) => void;
}

const NoteList: React.FC<NoteListProps> = ({
    notes,
    sharedNotes,
    selectedNote,
    onNoteSelect,
    onDeleteNote,
    onMakePublic,
    onShare
}) => {
    return (
        <div className="note-lists-container">
            {/* My Notes Section */}
            <section className="my-notes-section">
                <h2>My Notes</h2>
                <div className="notes-grid">
                    {notes.map((note) => (
                        <div 
                            key={note.id} 
                            className={`note-card ${selectedNote?.id === note.id ? 'selected' : ''}`}
                        >
                            <div className="note-content" onClick={() => onNoteSelect(note)}>
                                <h3>{note.title}</h3>
                                <p>{note.content.substring(0, 100)}...</p>
                                <small>Category: {note.category}</small>
                            </div>
                            <div className="note-actions">
                                <button onClick={() => onDeleteNote(note.id)}>Delete</button>
                                <button onClick={() => onShare(note.id)}>Share</button>
                                {!note.isPublic && (
                                    <button onClick={() => onMakePublic(note.id)}>Make Public</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Shared Notes Section */}
            <section className="shared-notes-section">
                <h2>Shared Notes</h2>
                <div className="notes-grid">
                    {sharedNotes.length > 0 ? (
                        sharedNotes.map((note) => (
                            <div 
                                key={note.id} 
                                className="note-card shared"
                            >
                                <div className="note-content" onClick={() => onNoteSelect(note)}>
                                    <h3>{note.title}</h3>
                                    <p>{note.content.substring(0, 100)}...</p>
                                    <div className="note-metadata">
                                        <small>Category: {note.category}</small>
                                        <small>Shared by: {note.user?.username}</small>
                                        <small>{note.isPublic ? '(Public)' : '(Shared with you)'}</small>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-notes-message">No shared notes available</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default NoteList;