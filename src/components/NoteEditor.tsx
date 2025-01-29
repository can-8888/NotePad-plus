import React, { useState, useEffect } from 'react';  // Adăugăm useEffect
import { Note } from '../types/Note';

interface NoteEditorProps {
    note?: Note;
    onSave: (note: Partial<Note>) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [category, setCategory] = useState(note?.category || '');

    // Actualizăm starea când se schimbă notița selectată
    useEffect(() => {
        setTitle(note?.title || '');
        setContent(note?.content || '');
        setCategory(note?.category || '');
    }, [note]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            content,
            category,
        });
        // Resetăm câmpurile după salvare
        if (!note) {
            setTitle('');
            setContent('');
            setCategory('');
        }
    };

    return (
        <form className="note-editor" onSubmit={handleSubmit}>
            <h2>{note ? 'Editează Notița' : 'Notiță Nouă'}</h2>
            <input
                type="text"
                placeholder="Titlu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <input
                type="text"
                placeholder="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            />
            <textarea
                placeholder="Conținutul notiței..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <button type="submit">
                {note ? 'Actualizează' : 'Salvează'}
            </button>
        </form>
    );
};

export default NoteEditor;