import React, { useEffect, useRef, useState } from 'react';
import { Note } from '../types/Note';
import { signalRService } from '../services/signalR';
import './NoteEditor.css';  // Make sure this is the exact path

interface NoteEditorProps {
    note?: Note;
    onSave: (note: Partial<Note>) => Promise<void>;
    onCancel: () => void;
}

interface Selection {
    start: number;
    end: number;
}

interface CollaboratorState {
    username: string;
    isTyping: boolean;
    cursorPosition?: number;
    selection?: Selection;
    color: string;
}

interface HistoryEntry {
    content: string;
    cursorPosition: number;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [collaborators, setCollaborators] = React.useState<CollaboratorState[]>([]);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const lastUpdateRef = useRef<number>(0);
    const updateTimeoutRef = useRef<NodeJS.Timeout>();
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
    const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
    const lastSavedRef = useRef<string>('');
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

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

            // Enhanced collaborator tracking
            signalRService.onCollaboratorJoined((username) => {
                setCollaborators(prev => [...prev, { username, isTyping: false }]);
            });

            signalRService.onCollaboratorLeft((username) => {
                setCollaborators(prev => prev.filter(c => c.username !== username));
            });

            // Typing indicators
            signalRService.onUserStartedTyping((username) => {
                setCollaborators(prev => 
                    prev.map(c => c.username === username ? { ...c, isTyping: true } : c)
                );
            });

            signalRService.onUserStoppedTyping((username) => {
                setCollaborators(prev => 
                    prev.map(c => c.username === username ? { ...c, isTyping: false } : c)
                );
            });

            // Cursor tracking
            signalRService.onCursorMoved((username, position) => {
                setCollaborators(prev => 
                    prev.map(c => c.username === username ? { ...c, cursorPosition: position } : c)
                );
                showCollaboratorCursor(username, position);
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
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [note?.id]);

    const showCollaboratorCursor = (username: string, position: number) => {
        if (!contentRef.current) return;

        const existingCursor = document.querySelector(`.collaborator-cursor-${username}`);
        existingCursor?.remove();

        const cursor = document.createElement('div');
        cursor.className = `collaborator-cursor collaborator-cursor-${username}`;
        cursor.setAttribute('data-username', username);
        cursor.style.color = getColorForUsername(username);

        const { top, left } = calculateCursorPosition(position);
        cursor.style.top = `${top}px`;
        cursor.style.left = `${left}px`;

        contentRef.current.parentElement?.appendChild(cursor);
        setTimeout(() => cursor.remove(), 2000);
    };

    const calculateCursorPosition = (position: number) => {
        if (!contentRef.current) return { top: 0, left: 0 };

        const textArea = contentRef.current;
        const textBeforeCursor = content.substring(0, position);
        const lines = textBeforeCursor.split('\n');
        const lineHeight = 20; // Approximate line height
        const charWidth = 8; // Approximate character width

        return {
            top: (lines.length - 1) * lineHeight,
            left: lines[lines.length - 1].length * charWidth
        };
    };

    const getColorForUsername = (username: string) => {
        const colors = ['#2196f3', '#4caf50', '#f44336', '#ff9800', '#9c27b0'];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Notify typing started
        if (note) {
            signalRService.notifyTypingStarted(note.id);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to notify typing stopped
            typingTimeoutRef.current = setTimeout(() => {
                if (note) {
                    signalRService.notifyTypingStopped(note.id);
                }
            }, 1000);

            // Throttle content updates
            const now = Date.now();
            if (now - lastUpdateRef.current > 500) {
                signalRService.updateNote(note.id, newContent);
                lastUpdateRef.current = now;
            } else {
                if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                }
                updateTimeoutRef.current = setTimeout(() => {
                    signalRService.updateNote(note.id, newContent);
                    lastUpdateRef.current = Date.now();
                }, 500);
            }
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

    // Add selection tracking
    const handleSelectionChange = () => {
        if (!note || !contentRef.current) return;
        
        const textarea = contentRef.current;
        const selection = {
            start: textarea.selectionStart,
            end: textarea.selectionEnd
        };

        if (selection.start !== selection.end) {
            signalRService.updateSelection(note.id, selection);
        }
    };

    // Add undo/redo handling
    const addToHistory = (content: string) => {
        if (!contentRef.current) return;

        setUndoStack(prev => [...prev, {
            content,
            cursorPosition: contentRef.current.selectionStart
        }]);
        setRedoStack([]);
    };

    const undo = () => {
        if (undoStack.length === 0) return;

        const current = {
            content,
            cursorPosition: contentRef.current?.selectionStart ?? 0
        };
        const previous = undoStack[undoStack.length - 1];

        setRedoStack(prev => [...prev, current]);
        setUndoStack(prev => prev.slice(0, -1));
        setContent(previous.content);

        if (contentRef.current) {
            contentRef.current.selectionStart = previous.cursorPosition;
            contentRef.current.selectionEnd = previous.cursorPosition;
        }

        if (note) {
            signalRService.updateNote(note.id, previous.content);
        }
    };

    const redo = () => {
        if (redoStack.length === 0) return;

        const current = {
            content,
            cursorPosition: contentRef.current?.selectionStart ?? 0
        };
        const next = redoStack[redoStack.length - 1];

        setUndoStack(prev => [...prev, current]);
        setRedoStack(prev => prev.slice(0, -1));
        setContent(next.content);

        if (contentRef.current) {
            contentRef.current.selectionStart = next.cursorPosition;
            contentRef.current.selectionEnd = next.cursorPosition;
        }

        if (note) {
            signalRService.updateNote(note.id, next.content);
        }
    };

    // Add auto-save functionality
    useEffect(() => {
        if (note && content !== lastSavedRef.current) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            autoSaveTimeoutRef.current = setTimeout(() => {
                handleSave();
                lastSavedRef.current = content;
            }, 3000); // Auto-save after 3 seconds of no changes
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [content, note]);

    // Add keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return (
        <div className="note-editor">
            <h2>{note ? 'Edit Note' : 'Create Note'}</h2>
            {collaborators.length > 0 && (
                <div className="collaborators">
                    <span>Currently editing: </span>
                    {collaborators.map(collaborator => (
                        <span 
                            key={collaborator.username} 
                            className={`collaborator-badge ${collaborator.isTyping ? 'typing' : ''}`}
                            style={{ backgroundColor: getColorForUsername(collaborator.username) }}
                        >
                            {collaborator.username}
                            {collaborator.isTyping && <span className="typing-indicator" />}
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
            <div className="editor-toolbar">
                <button onClick={undo} disabled={undoStack.length === 0}>
                    Undo
                </button>
                <button onClick={redo} disabled={redoStack.length === 0}>
                    Redo
                </button>
            </div>
            <textarea
                ref={contentRef}
                placeholder="Note content..."
                value={content}
                onChange={handleContentChange}
                onClick={handleMouseMove}
                onKeyUp={handleKeyUp}
                onSelect={handleSelectionChange}
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