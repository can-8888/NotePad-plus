import React, { useState, useEffect } from 'react';  // Adăugăm useEffect
import { Note } from '../types/Note';
import './NoteEditor.css';  // Make sure this is the exact path

interface NoteEditorProps {
    note?: Note;
    onSave: (noteData: Partial<Note>) => Promise<void>;
    onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [category, setCategory] = useState(note?.category || '');

    // Actualizăm starea când se schimbă notița selectată
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
            setCategory(note.category);
        } else {
            setTitle('');
            setContent('');
            setCategory('');
        }
    }, [note]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            title,
            content,
            category
        });
        setTitle('');
        setContent('');
        setCategory('');
    };

    return (
        <div className="note-editor">
            <h2>{note ? 'Edit Note' : 'New Note'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <input
                        type="text"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="content">Content:</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />
                </div>
                <div className="button-group">
                    <button type="submit">Save</button>
                    <button type="button" onClick={onCancel}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default NoteEditor;