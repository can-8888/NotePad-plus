import React from 'react';
import { Note } from '../types/Note';

interface NoteListProps {
    notes: Note[];
    onNoteSelect: (note: Note) => void;
    onDeleteNote: (noteId: number) => void;
    selectedNote?: Note;  // Adăugăm prop pentru notița selectată
}

const NoteList: React.FC<NoteListProps> = ({ 
    notes, 
    onNoteSelect, 
    onDeleteNote,
    selectedNote 
}) => {
    return (
        <div className="note-list">
            <h2>Notițele Mele</h2>
            <div className="notes-grid">
                {notes.map((note) => (
                    <div 
                        key={note.id} 
                        className={`note-card ${selectedNote?.id === note.id ? 'selected' : ''}`}
                    >
                        <div 
                            className="note-content"
                            onClick={() => onNoteSelect(note)}
                        >
                            <h3>{note.title}</h3>
                            <p>{note.content.substring(0, 100)}...</p>
                            <small>Categoria: {note.category}</small>
                        </div>
                        <button 
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                            }}
                        >
                            Șterge
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NoteList;