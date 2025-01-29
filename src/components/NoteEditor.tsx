import React, { useEffect, useRef } from 'react';
import { Note } from '../types/Note';
import { signalRService } from '../services/signalR';
import './NoteEditor.css';  // Make sure this is the exact path

interface NoteEditorProps {
    note?: Note;
    onSave: (note: Partial<Note>) => Promise<void>;
    onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [collaborators, setCollaborators] = React.useState<string[]>([]);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const lastUpdateRef = useRef<number>(0);
    const updateTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (note) {
            // Editing existing note
            setTitle(note.title);
            setContent(note.content);
            setCategory(note.category);
            
            // Join the note's SignalR group
            signalRService.joinNote(note.id);

            // Listen for updates from other users
            signalRService.onNoteUpdated((noteId, updatedContent) => {
                if (noteId === note.id) {
                    setContent(updatedContent);
                }
            });

            // Listen for cursor movements
            signalRService.onCursorMoved((username, position) => {
                showCursorPosition(username, position);
            });

            // Listen for collaborator presence with type annotations
            signalRService.onCollaboratorJoined((username: string) => {
                setCollaborators(prev => [...prev, username]);
            });

            signalRService.onCollaboratorLeft((username: string) => {
                setCollaborators(prev => prev.filter(u => u !== username));
            });
        } else {
            // Creating new note
            setTitle('');
            setContent('');
            setCategory('');
        }

        return () => {
            if (note) {
                signalRService.leaveNote(note.id);
                signalRService.removeAllHandlers(); // Clean up event handlers
            }
        };
    }, [note?.id]);

    const showCursorPosition = (username: string, position: number) => {
        if (!contentRef.current) return;

        // Remove existing cursor for this user
        const existingCursor = document.querySelector(`.cursor-${username}`);
        existingCursor?.remove();

        // Create new cursor element
        const cursor = document.createElement('div');
        cursor.className = `cursor cursor-${username}`;
        cursor.innerHTML = `<div class="cursor-flag">${username}</div>`;
        cursor.style.position = 'absolute';

        // Calculate cursor position
        const textArea = contentRef.current;
        const textBeforeCursor = content.substring(0, position);
        const lines = textBeforeCursor.split('\n');
        const lineNumber = lines.length - 1;
        const charPosition = lines[lines.length - 1].length;

        // Position the cursor
        const lineHeight = 20; // Approximate line height
        cursor.style.top = `${lineNumber * lineHeight}px`;
        cursor.style.left = `${charPosition * 8}px`; // Approximate character width

        // Add cursor to editor
        textArea.parentElement?.appendChild(cursor);

        // Remove cursor after a delay
        setTimeout(() => cursor.remove(), 2000);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Throttle updates to avoid overwhelming the server
        const now = Date.now();
        if (now - lastUpdateRef.current > 500) {
            if (note) {
                signalRService.updateNote(note.id, newContent);
                lastUpdateRef.current = now;
            }
        } else {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            updateTimeoutRef.current = setTimeout(() => {
                if (note) {
                    signalRService.updateNote(note.id, newContent);
                    lastUpdateRef.current = Date.now();
                }
            }, 500);
        }
    };

    const updateCursorPosition = () => {
        if (!note || !contentRef.current) return;
        const textarea = contentRef.current;
        const cursorPosition = textarea.selectionStart;
        signalRService.updateCursorPosition(note.id, cursorPosition);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        updateCursorPosition();
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        updateCursorPosition();
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await onSave({
                ...(note || {}), // Spread existing note if editing, empty object if creating
                title,
                content,
                category
            });
            if (!note) {
                // Clear form after creating new note
                setTitle('');
                setContent('');
                setCategory('');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="note-editor">
            <h2>{note ? 'Edit Note' : 'Create Note'}</h2>
            {collaborators.length > 0 && (
                <div className="collaborators">
                    <span>Currently editing: </span>
                    {collaborators.map(username => (
                        <span key={username} className="collaborator-badge">
                            {username}
                        </span>
                    ))}
                </div>
            )}
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            />
            <textarea
                ref={contentRef}
                placeholder="Note content..."
                value={content}
                onChange={handleContentChange}
                onClick={handleMouseMove}
                onKeyUp={handleKeyUp}
            />
            <div className="button-group">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : (note ? 'Save' : 'Create')}
                </button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default NoteEditor;