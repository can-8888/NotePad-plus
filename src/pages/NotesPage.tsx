import React, { useEffect, useState } from 'react';
import NoteList from '../components/NoteList';
import { Note } from '../types/Note';
import { api } from '../services/api';
import './NotesPage.css';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import NoteEditor from '../components/NoteEditor';
import { ShareNoteDialog } from '../components/ShareNoteDialog';

interface NotesPageProps {
    type?: 'personal' | 'shared' | 'public';
    isCreating?: boolean;
}

const NotesPage: React.FC<NotesPageProps> = ({ type = 'personal', isCreating = false }) => {
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
            
            switch (type) {
                case 'shared':
                    fetchedNotes = await api.getSharedNotes();
                    break;
                case 'public':
                    fetchedNotes = await api.getPublicNotes();
                    break;
                default:
                    fetchedNotes = await api.getNotes();
            }
            
            console.log('Fetched notes:', fetchedNotes);
            setNotes(fetchedNotes);
        } catch (err) {
            console.error('Error loading notes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load notes');
        } finally {
            setIsLoading(false);
        }
    };

    // Use loadNotes in useEffect
    useEffect(() => {
        loadNotes();
    }, [type]);

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

    const handleDebugShares = async () => {
        try {
            const debugInfo = await api.debugGetAllShares();
            console.log('Debug info:', debugInfo);
        } catch (error) {
            console.error('Error getting debug info:', error);
        }
    };

    if (isLoading) return <div>Loading notes...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="notes-page">
            <h1>
                {type === 'shared' && 'Shared Notes'}
                {type === 'public' && 'Public Notes'}
                {type === 'personal' && 'My Notes'}
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
                    <span>No {type} notes found</span>
                    <span>
                        {type === 'shared' && 'Notes shared with you will appear here'}
                        {type === 'public' && 'Public notes from other users will appear here'}
                        {type === 'personal' && 'Create your first note to get started'}
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
            <button onClick={handleDebugShares}>Debug Shares</button>
        </div>
    );
};

export default NotesPage; 