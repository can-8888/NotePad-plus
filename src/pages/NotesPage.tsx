import React, { useEffect, useState } from 'react';
import NoteList from '../components/NoteList';
import { Note } from '../types/Note';
import { api } from '../services/api';
import './NotesPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import NoteEditor from '../components/NoteEditor';
import { ShareNoteDialog } from '../components/ShareNoteDialog';

interface LocationState {
    type?: 'public' | 'shared';
}

interface NotesPageProps {
    type?: string;
    isCreating?: boolean;
}

const NotesPage: React.FC<NotesPageProps> = ({ type: propType, isCreating = false }) => {
    const location = useLocation();
    const locationState = location.state as LocationState;
    
    // Use type from props or location state
    const noteType = propType || locationState?.type || 'my-notes';

    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(isCreating);
    const [shareNoteId, setShareNoteId] = useState<number | null>(null);
    const navigate = useNavigate();

    // Move loadNotes outside useEffect
    const loadNotes = async () => {
        try {
            console.log('Loading notes...');
            setIsLoading(true);
            setError(null);
            let fetchedNotes: Note[];
            
            switch (noteType) {
                case 'shared':
                    fetchedNotes = await api.getSharedNotes();
                    console.log('Fetched shared notes:', fetchedNotes);
                    break;
                case 'public':
                    fetchedNotes = await api.getPublicNotes();
                    console.log('Fetched public notes:', fetchedNotes);
                    break;
                default:
                    fetchedNotes = await api.getNotes();
                    console.log('Fetched personal notes:', fetchedNotes);
            }
            
            if (!Array.isArray(fetchedNotes)) {
                console.warn('Fetched notes is not an array:', fetchedNotes);
                fetchedNotes = [];
            }
            
            setNotes(fetchedNotes);
        } catch (err) {
            console.error('Error loading notes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load notes');
            setNotes([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Use loadNotes in useEffect
    useEffect(() => {
        console.log('NotesPage type:', noteType);
        // Load notes based on type
        if (noteType === 'public') {
            loadNotes();
        } else if (noteType === 'shared') {
            loadNotes();
        } else {
            loadNotes();
        }
    }, [noteType]);

    useEffect(() => {
        setIsNoteModalOpen(isCreating);
    }, [isCreating]);

    const handleNoteSelect = (note: Note) => {
        setSelectedNote(note);
        setIsNoteModalOpen(true);
    };

    const handleDeleteNote = async (id: number) => {
        try {
            await api.deleteNote(id);
            setNotes(notes.filter(note => note.id !== id));
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    const handleMakePublic = async (noteId: number) => {
        try {
            console.log('NotesPage: Making note public:', noteId);
            console.log('Current notes:', notes);
            await api.makeNotePublic(noteId);
            console.log('Note made public successfully');
            await loadNotes();  // Now this will work
        } catch (error) {
            console.error('Error making note public:', error);
        }
    };

    const handleShare = async (id: number) => {
        setShareNoteId(id);
    };

    const handleShareComplete = async (collaboratorId: number) => {
        try {
            if (shareNoteId) {
                await api.shareNote(shareNoteId, collaboratorId);
                // Refresh notes after sharing
                const updatedNotes = await api.getNotes();
                setNotes(updatedNotes);
                setShareNoteId(null);
            }
        } catch (err) {
            console.error('Error sharing note:', err);
            setError(err instanceof Error ? err.message : 'Failed to share note');
        }
    };

    const handleSaveNote = async (note: Partial<Note>) => {
        try {
            setError(null);
            if (selectedNote) {
                await api.updateNote(selectedNote.id, note);
            } else {
                await api.createNote(note);
            }
            // Refresh notes list immediately after saving
            const updatedNotes = await api.getNotes();
            setNotes(updatedNotes);
            setIsNoteModalOpen(false);
            setSelectedNote(null);
            // Navigate back to the notes list
            navigate('/notes', { replace: true });
        } catch (err) {
            console.error('Error saving note:', err);
            setError(err instanceof Error ? err.message : 'Failed to save note');
        }
    };

    const handleCloseModal = () => {
        setIsNoteModalOpen(false);
        setSelectedNote(null);
        // Navigate back to the notes list
        navigate('/notes', { replace: true });
    };

    // Get unique categories using Object.keys and reduce
    const categories = notes
        .reduce((acc: { [key: string]: boolean }, note) => {
            if (note.category) {
                acc[note.category] = true;
            }
            return acc;
        }, {});
    const uniqueCategories = Object.keys(categories);

    // Filter and sort notes
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || note.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) return <div>Loading notes...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="notes-page">
            <h1>
                {noteType === 'shared' && 'Shared Notes'}
                {noteType === 'public' && 'Public Notes'}
                {noteType === 'my-notes' && 'My Notes'}
            </h1>
            {isNoteModalOpen && (
                <Modal 
                    isOpen={isNoteModalOpen}
                    title="Create New Note"
                    onClose={() => {
                        setIsNoteModalOpen(false);
                        navigate('/notes');
                    }}
                >
                    <NoteEditor
                        onSave={handleSaveNote}
                        onCancel={() => {
                            setIsNoteModalOpen(false);
                            navigate('/notes');
                        }}
                    />
                </Modal>
            )}
            {shareNoteId && (
                <Modal
                    isOpen={true}
                    title="Share Note"
                    onClose={() => setShareNoteId(null)}
                >
                    <ShareNoteDialog
                        noteId={shareNoteId}
                        onShare={handleShareComplete}
                        onClose={() => setShareNoteId(null)}
                    />
                </Modal>
            )}
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
                    <option value="">All Categories</option>
                    {uniqueCategories.map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="title">Title</option>
                    <option value="category">Category</option>
                </select>
            </div>
            {notes.length === 0 ? (
                <div className="empty-state">
                    <span>No {noteType} notes found</span>
                    <span>
                        {noteType === 'shared' && 'Notes shared with you will appear here'}
                        {noteType === 'public' && 'Public notes from other users will appear here'}
                        {noteType === 'my-notes' && 'Create your first note to get started'}
                    </span>
                </div>
            ) : (
                <div className="notes-container">
                    <NoteList 
                        notes={filteredNotes}
                        isLoading={isLoading}
                        error={error}
                        onNoteSelect={handleNoteSelect}
                        onDeleteNote={handleDeleteNote}
                        onMakePublic={handleMakePublic}
                        onShare={handleShare}
                    />
                </div>
            )}
        </div>
    );
};

export default NotesPage; 