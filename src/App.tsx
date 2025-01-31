import React, { useState, useEffect } from 'react';
import './App.css';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { useAuth } from './contexts/AuthContext';
import { Note, NoteApiResponse, NoteStatus } from './types/Note';
import { api } from './services/api';
import { ShareNoteDialog } from './components/ShareNoteDialog';
import Modal from './components/Modal';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

type SortOption = 'date-desc' | 'date-asc' | 'title' | 'category';
type ViewType = 'my-notes' | 'shared-notes' | 'public-notes';

function AppContent() {
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
    const [shareDialogNoteId, setShareDialogNoteId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<ViewType>('my-notes');
    const [publicNotes, setPublicNotes] = useState<Note[]>([]);
    const [sharedWithMeNotes, setSharedWithMeNotes] = useState<Note[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

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
            
            const [myNotesResponse, shared] = await Promise.all([
                api.getNotes(),
                api.getSharedNotes()
            ]) as [NoteApiResponse[], Note[]];
            
            console.log('API Response - myNotes:', myNotesResponse);
            console.log('API Response - shared:', shared);
            
            // Convert API response to Note format
            const formattedMyNotes: Note[] = myNotesResponse.map(note => ({
                id: note.id ?? note.Id ?? 0,
                title: note.title ?? note.Title ?? '',
                content: note.content ?? note.Content ?? '',
                category: note.category ?? note.Category ?? '',
                createdAt: new Date(note.createdAt ?? note.CreatedAt ?? Date.now()),
                updatedAt: new Date(note.updatedAt ?? note.UpdatedAt ?? Date.now()),
                userId: note.userId ?? note.UserId ?? 0,
                isPublic: note.isPublic ?? note.IsPublic ?? false,
                status: note.status ?? note.Status ?? NoteStatus.Personal,
                user: note.user ?? note.User
            }));

            console.log('Setting notes state with:', formattedMyNotes);
            setNotes(formattedMyNotes);
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

    const handleCreateNote = () => {
        setSelectedNote(undefined);
        setIsCreating(true);
        setIsNoteModalOpen(true);
    };

    const handleCloseModal = () => {
        console.log('Modal close triggered');
        setIsNoteModalOpen(false);
        setIsCreating(false);
        setSelectedNote(undefined);
    };

    const handleNoteSelect = (note: Note) => {
        console.log('Note selected:', note);
        setSelectedNote(note);
        setIsNoteModalOpen(true);
        console.log('Modal opened');
    };

    const handleSaveNote = async (noteData: Partial<Note>) => {
        try {
            console.log('Saving note:', noteData);
            if (noteData.id) {
                // Updating existing note
                await api.updateNote(noteData.id, noteData);
            } else {
                // Creating new note
                await api.createNote(noteData);
            }
            await loadAllNotes();
            setSelectedNote(undefined);
            setIsCreating(false);
            console.log('Note saved successfully');
            setIsNoteModalOpen(false);
        } catch (err) {
            console.error('Failed to save note:', err);
            setError('Failed to save note');
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
                const apiNote = await api.getNotes().then(notes => 
                    notes.find(n => n.id === noteId || n.Id === noteId)
                );

                if (apiNote) {
                    // Convert API response to Note format
                    const updatedNote: Note = {
                        id: apiNote.id ?? apiNote.Id ?? 0,
                        title: apiNote.title ?? apiNote.Title ?? '',
                        content: apiNote.content ?? apiNote.Content ?? '',
                        category: apiNote.category ?? apiNote.Category ?? '',
                        createdAt: new Date(apiNote.createdAt ?? apiNote.CreatedAt ?? Date.now()),
                        updatedAt: new Date(apiNote.updatedAt ?? apiNote.UpdatedAt ?? Date.now()),
                        userId: apiNote.userId ?? apiNote.UserId ?? 0,
                        isPublic: apiNote.isPublic ?? apiNote.IsPublic ?? false,
                        status: apiNote.status ?? apiNote.Status ?? NoteStatus.Personal,
                        user: apiNote.user ?? apiNote.User
                    };
                    setSelectedNote(updatedNote);
                }
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
            // First filter by user
            if (!user) return false;
            const userId = user.id ?? user.Id ?? 0;
            const noteUserId = note.userId;
            if (userId !== noteUserId) return false;
            
            // Then filter by search and category
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

    const handleShare = (noteId: number) => {
        setShareDialogNoteId(noteId);
    };

    const handleShareComplete = async () => {
        await loadAllNotes(); // Reload notes to update the UI
        setShareDialogNoteId(null);
    };

    const loadPublicNotes = async () => {
        try {
            console.log('Loading public notes...');
            const response = await api.getPublicNotes();
            console.log('Public notes received:', response);
            setPublicNotes(response);
        } catch (err) {
            console.error('Failed to load public notes:', err);
            setError('Failed to load public notes');
        }
    };

    const loadSharedWithMeNotes = async () => {
        try {
            console.log('Loading shared notes...');
            setIsLoading(true);
            const shared = await api.getSharedWithMeNotes();
            console.log('Shared notes received:', shared);
            if (Array.isArray(shared)) {
                setSharedWithMeNotes(shared);
            } else {
                console.error('Received invalid shared notes data:', shared);
                setError('Invalid shared notes data received');
            }
        } catch (err) {
            console.error('Failed to load shared notes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load shared notes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            console.log('Current view:', currentView);
            switch (currentView) {
                case 'my-notes':
                    loadAllNotes();
                    break;
                case 'shared-notes':
                    loadSharedWithMeNotes();
                    break;
                case 'public-notes':
                    loadPublicNotes();
                    break;
            }
        }
    }, [currentView, user]);

    // Update setCurrentView to also update the URL
    const handleViewChange = (view: ViewType) => {
        setCurrentView(view);
        switch (view) {
            case 'my-notes':
                navigate('/notes');
                break;
            case 'shared-notes':
                navigate('/notes/shared');
                break;
            case 'public-notes':
                navigate('/notes/public');
                break;
        }
    };

    // Add effect to sync URL with current view
    useEffect(() => {
        const path = location.pathname;
        if (path === '/notes/public' && currentView !== 'public-notes') {
            setCurrentView('public-notes');
        } else if (path === '/notes/shared' && currentView !== 'shared-notes') {
            setCurrentView('shared-notes');
        } else if (path === '/notes' && currentView !== 'my-notes') {
            setCurrentView('my-notes');
        }
    }, [location.pathname]);

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
                    <span>Welcome, {user?.username || user?.Username}!</span>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="App-layout">
                <nav className="sidebar">
                    <button 
                        className="create-note-button sidebar-create"
                        onClick={handleCreateNote}
                    >
                        Create New Note
                    </button>
                    <div className="nav-section">
                        <div 
                            className={`nav-item ${currentView === 'my-notes' ? 'active' : ''}`}
                            onClick={() => handleViewChange('my-notes')}
                        >
                            <span className="nav-icon">📁</span>
                            My Notes
                        </div>
                        <div 
                            className={`nav-item ${currentView === 'shared-notes' ? 'active' : ''}`}
                            onClick={() => handleViewChange('shared-notes')}
                        >
                            <span className="nav-icon">🔄</span>
                            Notes Shared With Me
                        </div>
                        <div 
                            className={`nav-item ${currentView === 'public-notes' ? 'active' : ''}`}
                            onClick={() => handleViewChange('public-notes')}
                        >
                            <span className="nav-icon">🌐</span>
                            Public Notes
                        </div>
                    </div>
                </nav>

                <main className="main-content">
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

                    <div className="notes-container">
                        {currentView === 'my-notes' && (
                            <NoteList 
                                notes={filteredAndSortedNotes}
                                selectedNote={selectedNote}
                                onNoteSelect={handleNoteSelect}
                                onDeleteNote={handleDeleteNote}
                                onMakePublic={handleMakePublic}
                                onShare={handleShare}
                            />
                        )}
                        {currentView === 'shared-notes' && (
                            <NoteList 
                                notes={sharedWithMeNotes}
                                selectedNote={selectedNote}
                                onNoteSelect={handleNoteSelect}
                                onDeleteNote={handleDeleteNote}
                                onMakePublic={handleMakePublic}
                                onShare={handleShare}
                                isLoading={isLoading}
                                error={error}
                            />
                        )}
                        {currentView === 'public-notes' && (
                            <NoteList 
                                notes={publicNotes}
                                selectedNote={selectedNote}
                                onNoteSelect={handleNoteSelect}
                                onDeleteNote={handleDeleteNote}
                                onMakePublic={handleMakePublic}
                                onShare={handleShare}
                            />
                        )}
                    </div>
                </main>
            </div>

            <Modal 
                isOpen={isNoteModalOpen}
                onClose={handleCloseModal}
                title={isCreating ? 'Create New Note' : 'Edit Note'}
            >
                <NoteEditor 
                    note={selectedNote}
                    onSave={async (note) => {
                        console.log('Save triggered from NoteEditor');
                        await handleSaveNote(note);
                    }}
                    onCancel={() => {
                        console.log('Cancel triggered from NoteEditor');
                        handleCloseModal();
                    }}
                />
            </Modal>

            {shareDialogNoteId && (
                <ShareNoteDialog
                    noteId={shareDialogNoteId}
                    onClose={() => setShareDialogNoteId(null)}
                    onShare={handleShareComplete}
                />
            )}
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/*" element={<AppContent />} />
        </Routes>
    );
}

export default App;