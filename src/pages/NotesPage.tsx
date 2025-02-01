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
    viewType?: 'my-notes' | 'shared' | 'public';
    isCreating?: boolean;
}

const NotesPage: React.FC<NotesPageProps> = ({ viewType = 'my-notes', isCreating = false }) => {
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

    // Add effect to handle isCreating prop changes
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

    const handleMakePublic = async (id: number) => {
        try {
            await api.makeNotePublic(id);
            // Refresh notes after making public
            const updatedNotes = await api.getNotes();
            setNotes(updatedNotes);
        } catch (err) {
            console.error('Error making note public:', err);
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

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setIsLoading(true);
                let fetchedNotes;
                switch (viewType) {
                    case 'shared':
                        fetchedNotes = await api.getSharedNotes();
                        break;
                    case 'public':
                        fetchedNotes = await api.getPublicNotes();
                        break;
                    default:
                        fetchedNotes = await api.getNotes();
                }
                setNotes(fetchedNotes);
            } catch (err) {
                setError('Failed to fetch notes');
                console.error('Error fetching notes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotes();
    }, [viewType]);

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

    return (
        <div className="notes-page">
            <h1>{viewType === 'shared' ? 'Shared Notes' : viewType === 'public' ? 'Public Notes' : 'My Notes'}</h1>
            {isNoteModalOpen && (
                <Modal 
                    isOpen={isNoteModalOpen}
                    title={selectedNote ? "Edit Note" : "Create New Note"}
                    onClose={handleCloseModal}
                >
                    <NoteEditor
                        note={selectedNote || undefined}
                        onSave={handleSaveNote}
                        onCancel={handleCloseModal}
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
        </div>
    );
};

export default NotesPage; 