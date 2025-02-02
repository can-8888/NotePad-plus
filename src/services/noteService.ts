import { api } from './api';
import { Note } from '../types/Note';

export const getNotes = async (): Promise<Note[]> => {
    const notes = await api.getNotes();
    return notes;
};

export const createNote = async (note: Partial<Note>): Promise<Note> => {
    return await api.createNote(note);
};

// Add other note-related service functions as needed 