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
            loadAllNotes();
        }
    }, [user]);

    const loadAllNotes = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            console.log('Loading notes for user:', user); // Debug log
            
            const [myNotes, shared] = await Promise.all([
                api.getNotes(),
                api.getSharedNotes()
            ]);
            
            console.log('Loaded notes:', { myNotes, shared }); // Debug log
            
            setNotes(myNotes);
            setSharedNotes(shared);
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

            let savedNote: Note;
            if (selectedNote) {
                // Update existing note
                savedNote = await api.updateNote(selectedNote.id, {
                    ...noteData,
                    userId: user.id
                });
            } else {
                // Create new note
                savedNote = await api.createNote({
                    ...noteData,
                    userId: user.id
                });
            }

            // Update notes array
            setNotes(prevNotes => {
                const newNotes = selectedNote
                    ? prevNotes.map(note => note.id === savedNote.id ? savedNote : note)
                    : [...prevNotes, savedNote];
                console.log('Updated notes array:', newNotes); // Debug log
                return newNotes;
            });

            setSelectedNote(undefined);
        } catch (err) {
            setError('Failed to save note');
            console.error(err);
        }
    };

    const handleMakePublic = async (noteId: number) => {
        try {
            await api.makeNotePublic(noteId);
            await loadAllNotes(); // Reload notes to get updated status
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
            .filter(category => category); // Filter out empty categories

        return [
            <option key="all" value="">Toate categoriile</option>,
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
                    <div className="loading">Se încarcă...</div>
                ) : (
                    <>
                        <NoteList 
                            notes={filteredAndSortedNotes}
                            sharedNotes={sharedNotes}
                            selectedNote={selectedNote}
                            onNoteSelect={setSelectedNote}
                            onDeleteNote={handleDeleteNote}
                            onMakePublic={handleMakePublic}
                        />
                        <NoteEditor 
                            note={selectedNote}
                            onSave={handleSaveNote}
                            onCancel={() => setSelectedNote(undefined)}
                        />
                    </>
                )}
            </main>
        </div>
    );
}

export default App;