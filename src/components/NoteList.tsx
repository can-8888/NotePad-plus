import React, { useState } from 'react';
import { Note } from '../types/Note';
import { ShareNoteDialog } from './ShareNoteDialog';
import './NoteList.css';

interface NoteListProps {
    notes: Note[];
    sharedNotes?: Note[];
    selectedNote?: Note;
    onNoteSelect: (note: Note) => void;
    onDeleteNote: (id: number) => void;
    onMakePublic: (id: number) => void;
}

const NoteList: React.FC<NoteListProps> = ({
    notes,
    sharedNotes = [],
    selectedNote,
    onNoteSelect,
    onDeleteNote,
    onMakePublic
}) => {
    const [shareDialogNoteId, setShareDialogNoteId] = useState<number | null>(null);

    console.log('NoteList rendering with:', { notes, sharedNotes }); // Debug log

    if (!notes.length && !sharedNotes.length) {
        return <div className="no-notes">No notes found</div>;
    }

    return (
        <div className="note-list">
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
                            {!note.isPublic && (
                                <button onClick={() => onMakePublic(note.id)}>Make Public</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {sharedNotes.length > 0 && (
                <>
                    <h2>Shared Notes</h2>
                    <div className="notes-grid">
                        {sharedNotes.map((note) => (
                            <div key={note.id} className="note-card shared">
                                <div className="note-content" onClick={() => onNoteSelect(note)}>
                                    <h3>{note.title}</h3>
                                    <p>{note.content.substring(0, 100)}...</p>
                                    <small>
                                        Category: {note.category}<br/>
                                        Shared by: {note.user?.username}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default NoteList;