import React, { useState, useEffect } from 'react';
import './App.css';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { useAuth } from './contexts/AuthContext';
import { Note } from './types/Note';
import { api } from './services/api';

type SortOption = 'date-desc' | 'date-asc' | 'title' | 'category';

function App() {
    const { user, logout } = useAuth();
    const [showRegister, setShowRegister] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadNotes();
        }
    }, [user]);

    const loadNotes = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const loadedNotes = await api.getNotes();
            setNotes(loadedNotes);
        } catch (err) {
            setError('Failed to load notes');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        try {
            setError(null);
            await api.deleteNote(noteId);
            setNotes(notes.filter(note => note.id !== noteId));
            if (selectedNote?.id === noteId) {
                setSelectedNote(undefined);
            }
        } catch (err) {
            setError('Failed to delete note');
            console.error(err);
        }
    };

    const handleSaveNote = async (noteData: Partial<Note>) => {
        try {
            setError(null);
            if (!user) {
                throw new Error('User not authenticated');
            }
    
            if (selectedNote) {
                // Update existing note
                const updatedNote = await api.updateNote(selectedNote.id, {
                    ...noteData,
                    userId: user.id,
                    updatedAt: new Date()
                });
                setNotes(notes.map(note => 
                    note.id === selectedNote.id ? updatedNote : note
                ));
            } else {
                // Create new note
                const newNote = await api.createNote({
                    ...noteData,
                    userId: user.id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                setNotes([...notes, newNote]);
            }
            setSelectedNote(undefined);
        } catch (err) {
            setError('Failed to save note');
            console.error(err);
        }
    };

    const sortNotes = (notesToSort: Note[]): Note[] => {
        return [...notesToSort].sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'date-asc':
                    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });
    };

    const filteredAndSortedNotes = sortNotes(
        notes.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                note.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || note.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
    );

    if (!user) {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>Notepad+</h1>
                </header>
                <main className="auth-container">
                    {showRegister ? (
                        <>
                            <Register />
                            <p>
                                Ai deja cont?{' '}
                                <button onClick={() => setShowRegister(false)}>
                                    Autentifică-te
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <Login />
                            <p>
                                Nu ai cont?{' '}
                                <button onClick={() => setShowRegister(true)}>
                                    Înregistrează-te
                                </button>
                            </p>
                        </>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Notepad+</h1>
                <div className="user-info">
                    <span>Bine ai venit, {user.username}!</span>
                    <button className="logout-button" onClick={logout}>
                        Deconectare
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}
            
            <div className="search-filters">
                <input
                    type="text"
                    placeholder="Caută notițe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-filter"
                >
                    <option value="">Toate categoriile</option>
                    {Array.from(new Set(notes.map(note => note.category))).map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="sort-select"
                >
                    <option value="date-desc">Cele mai noi</option>
                    <option value="date-asc">Cele mai vechi</option>
                    <option value="title">După titlu</option>
                    <option value="category">După categorie</option>
                </select>
            </div>

            <main className="App-main">
                {isLoading ? (
                    <div className="loading">Se încarcă...</div>
                ) : (
                    <>
                        <NoteList 
                            notes={filteredAndSortedNotes}
                            onNoteSelect={setSelectedNote}
                            onDeleteNote={handleDeleteNote}
                            selectedNote={selectedNote}
                        />
                        <NoteEditor 
                            note={selectedNote}
                            onSave={handleSaveNote}
                        />
                    </>
                )}
            </main>
        </div>
    );
}

export default App;