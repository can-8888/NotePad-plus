import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { useAuth } from './contexts/AuthContext';
import { Note, NoteApiResponse, NoteStatus } from './types/Note';
import { api, getCurrentUser } from './services/api';
import { ShareNoteDialog } from './components/ShareNoteDialog';
import Modal from './components/Modal';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import NotesPage from './pages/NotesPage';
import Sidebar from './components/Sidebar';
import DrivePage from './pages/DrivePage';
import axios from 'axios';

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'title' | 'category';
type ViewType = 'my-notes' | 'shared-notes' | 'public-notes';

// Add this near the top of the file with other components
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (user) {
        return <Navigate to="/notes" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// Add this new Layout component
const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Notepad+</h1>
                <div className="user-info">
                    <span className="welcome-text">Welcome, {user?.username}!</span>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

function App() {
    const { user, isInitialized } = useAuth();
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
    const [currentView, setCurrentView] = useState<ViewType>('my-notes');
    const [publicNotes, setPublicNotes] = useState<Note[]>([]);
    const [sharedWithMeNotes, setSharedWithMeNotes] = useState<Note[]>([]);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
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
            const notesData = await api.getNotes();
            setNotes(notesData || []);
        } catch (err: any) { // Type as any for now
            if (err?.response?.status === 401) {
                // Handle unauthorized error
                navigate('/login');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load notes');
                console.error('Error loading notes:', err);
            }
            setNotes([]);
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

    const handleCloseModal = () => {
        console.log('Modal close triggered');
        setSelectedNote(undefined);
    };

    const handleNoteSelect = (note: Note) => {
        console.log('Note selected:', note);
        setSelectedNote(note);
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
            console.log('Note saved successfully');
        } catch (err) {
            console.error('Failed to save note:', err);
            setError('Failed to save note');
        }
    };

    const handleMakePublic = async (noteId: number) => {
        try {
            console.log('handleMakePublic called with noteId:', noteId);
            if (!noteId) {
                console.error('Invalid note ID:', noteId);
                return;
            }

            const updatedNote: Note = await api.makeNotePublic(noteId);
            console.log('Note successfully made public:', updatedNote);

            // Update both notes lists
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            setPublicNotes(prevPublicNotes => [...prevPublicNotes, updatedNote]);

            // Show success message
            setMessage({ type: 'success', text: 'Note is now public' });

            // Refresh lists
            await loadAllNotes();
            await loadPublicNotes();
        } catch (error) {
            console.error('Error making note public:', error);
            setError(error instanceof Error ? error.message : 'Failed to make note public');
        }
    };

    const sortNotes = (notes: Note[]): Note[] => {
        return [...notes].sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'date-asc':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'category':
                    // Handle undefined categories
                    const categoryA = a.category || '';
                    const categoryB = b.category || '';
                    return categoryA.localeCompare(categoryB);
                default:
                    return 0;
            }
        });
    };

    const filterNotes = useCallback((notesToFilter: Note[]) => {
        if (!notesToFilter) return [];
        
        let filtered = [...notesToFilter];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(note => note.category === selectedCategory);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'date-desc':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'category':
                    return (a.category || '').localeCompare(b.category || '');
                default:
                    return 0;
            }
        });

        return filtered;
    }, [searchTerm, selectedCategory, sortBy]);

    const filteredNotes = filterNotes(notes);

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
        console.log('Filtered notes:', filteredNotes);
    }, [notes, filteredNotes]);

    useEffect(() => {
        console.log('Notes state updated:', notes);
    }, [notes]);

    // Add useEffect to monitor sharedNotes changes
    useEffect(() => {
        console.log('Shared notes updated:', sharedNotes);
    }, [sharedNotes]);

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
            const publicNotes = await api.getPublicNotes();
            console.log('Public notes received:', publicNotes);
            setPublicNotes(publicNotes);
        } catch (err) {
            console.error('Error loading public notes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load public notes');
        }
    };

    const loadSharedNotes = async () => {
        try {
            console.log('Loading shared notes...');
            setIsLoading(true);
            const shared = await api.getSharedNotes();
            console.log('Shared notes received:', shared);
            if (Array.isArray(shared)) {
                setSharedWithMeNotes(shared);
            }
        } catch (err) {
            console.error('Error loading shared notes:', err);
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
                    loadSharedNotes();
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
                navigate('/shared-notes');
                break;
            case 'public-notes':
                navigate('/public-notes');
                break;
        }
    };

    // Add effect to sync URL with current view
    useEffect(() => {
        const path = location.pathname;
        if (path === '/public-notes' && currentView !== 'public-notes') {
            setCurrentView('public-notes');
        } else if (path === '/shared-notes' && currentView !== 'shared-notes') {
            setCurrentView('shared-notes');
        } else if (path === '/notes' && currentView !== 'my-notes') {
            setCurrentView('my-notes');
        }
    }, [location.pathname]);

    const handleShareNote = async (noteId: number, collaboratorId: number) => {
        try {
            const updatedNote = await api.shareNote(noteId, collaboratorId);
            
            // Update the notes list with the updated note
            setNotes(notes.map(note => 
                note.id === noteId ? updatedNote : note
            ));
            
            // Show success message
            setMessage({ type: 'success', text: 'Note shared successfully' });
        } catch (error) {
            console.error('Error sharing note:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to share note' });
        }
    };

    // Show loading state while auth is initializing
    if (!isInitialized) {
        return <div>Loading...</div>;
    }

    // If not authenticated, only render auth routes
    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={
                    <AuthRoute>
                        <div className="auth-container">
                            <Login />
                        </div>
                    </AuthRoute>
                } />
                <Route path="/register" element={
                    <AuthRoute>
                        <div className="auth-container">
                            <Register />
                        </div>
                    </AuthRoute>
                } />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Rest of your render logic for authenticated users
    return (
        <div className="App">
            <Routes>
                {/* Protected routes */}
                <Route path="/" element={
                    <Layout>
                        <Navigate to="/notes" replace />
                    </Layout>
                } />
                <Route path="/notes" element={
                    <Layout>
                        <NotesPage />
                    </Layout>
                } />
                <Route path="/notes/new" element={
                    <Layout>
                        <NotesPage isCreating={true} />
                    </Layout>
                } />
                <Route path="/shared-notes" element={
                    <Layout>
                        <NotesPage type="shared" />
                    </Layout>
                } />
                <Route path="/public-notes" element={
                    <Layout>
                        <NotesPage type="public" />
                    </Layout>
                } />
                <Route path="/drive" element={
                    <Layout>
                        <DrivePage />
                    </Layout>
                } />
            </Routes>
        </div>
    );
}

export default App;