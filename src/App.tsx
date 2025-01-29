import React, { useState, useEffect } from 'react';
import './App.css';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { useAuth } from './contexts/AuthContext';
import { Note } from './types/Note';
import { api } from './services/api';
import { ShareNoteDialog } from './components/ShareNoteDialog';

type SortOption = 'date-desc' | 'date-asc' | 'title' | 'category';

function App() {
    const { user, logout } = useAuth();
    const [showRegister, setShowRegister] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            console.log('User logged in, loading notes...'); // Debug log
            loadAllNotes();
        }
    }, [user]); // Only depend on user

    const loadAllNotes = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            console.log('Loading notes for user:', user);
            
            // Load both regular and shared notes
            const [myNotes, shared] = await Promise.all([
                api.getNotes(),
                api.getSharedNotes()
            ]);
            
            console.log('API Response - myNotes:', myNotes);
            console.log('API Response - shared:', shared);
            
            // Update both states
            setNotes(Array.isArray(myNotes) ? myNotes : []);
            setSharedNotes(Array.isArray(shared) ? shared : []);

        } catch (err) {
            console.error('Error loading notes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load notes');
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
                await api.updateNote(selectedNote.id, {
                    ...noteData,
                    userId: user.id
                });
            } else {
                // Create new note
                await api.createNote({
                    ...noteData,
                    userId: user.id
                });
            }

            // Reload all notes to get the latest state
            await loadAllNotes();
            setSelectedNote(undefined);
        } catch (err) {
            setError('Failed to save note');
            console.error(err);
        }
    };

    const handleMakePublic = async (noteId: number) => {
        try {
            setError(null);
            await api.makeNotePublic(noteId);
            
            // Reload both regular and shared notes
            await loadAllNotes();
            
            // Update the selected note if it was made public
            if (selectedNote?.id === noteId) {
                const updatedNote = await api.getNotes().then(notes => 
                    notes.find(n => n.id === noteId)
                );
                setSelectedNote(updatedNote);
            }
        } catch (err) {
            setError('Failed to make note public');
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
            if (!note?.title) return false;
            
            const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                note.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || note.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
    );

    const renderSortOptions = () => {
        const options = [
            { value: 'date-desc', label: 'Newest First' },
            { value: 'date-asc', label: 'Oldest First' },
            { value: 'title', label: 'Title' },
            { value: 'category', label: 'Category' }
        ];

        return options.map(option => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ));
    };

    const renderCategoryOptions = () => {
        const categories = Array.from(new Set(notes.map(note => note.category)))
            .filter(category => category);

        return [
            <option key="all" value="">All Categories</option>,
            ...categories.map(category => (
                <option key={category} value={category}>
                    {category}
                </option>
            ))
        ];
    };

    // Add debug logging for filtered notes
    useEffect(() => {
        console.log('Current notes:', notes);
        console.log('Filtered notes:', filteredAndSortedNotes);
    }, [notes, filteredAndSortedNotes]);

    useEffect(() => {
        console.log('Notes state updated:', notes);
    }, [notes]);

    // Add useEffect to monitor sharedNotes changes
    useEffect(() => {
        console.log('Shared notes updated:', sharedNotes);
    }, [sharedNotes]);

    const handleLogout = () => {
        // Clear UI state
        setSelectedNote(undefined);
        setSearchTerm('');
        setSelectedCategory('');
        setSortBy('date-desc');
        // Don't clear notes here, they'll be reloaded on next login
        logout();
    };

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
                                Already have an account?{' '}
                                <button onClick={() => setShowRegister(false)}>
                                    Login
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <Login />
                            <p>
                                Don't have an account?{' '}
                                <button onClick={() => setShowRegister(true)}>
                                    Register
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
                    <span>Welcome, {user.username}!</span>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}
            
            <div className="search-filters">
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-filter"
                >
                    {renderCategoryOptions()}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="sort-select"
                >
                    {renderSortOptions()}
                </select>
            </div>

            <main className="App-main">
                {isLoading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        <div className="left-panel">
                            <NoteEditor 
                                note={selectedNote}
                                onSave={handleSaveNote}
                                onCancel={() => setSelectedNote(undefined)}
                            />
                        </div>
                        <div className="right-panel">
                            <NoteList 
                                notes={filteredAndSortedNotes}
                                sharedNotes={sharedNotes}
                                selectedNote={selectedNote}
                                onNoteSelect={setSelectedNote}
                                onDeleteNote={handleDeleteNote}
                                onMakePublic={handleMakePublic}
                            />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default App;