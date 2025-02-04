import React, { useState, useEffect, useRef } from 'react';
import { DriveFile, Folder } from '../types/File';
import { api } from '../services/api';
import './DrivePage.css';
import { useNavigate, useLocation } from 'react-router-dom';

const DrivePage: React.FC = () => {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log('Current render state:', {
            currentFolder,
            filesCount: files.length,
            foldersCount: folders.length,
            filesInCurrentFolder: files.filter(f => f.folderId === currentFolder?.id).length,
            currentFolderId: currentFolder?.id
        });
    }, [files, folders, currentFolder]);

    useEffect(() => {
        // Load folders first, then handle files based on the URL
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null); // Clear any previous errors
                
                console.log('Loading folders...');
                const foldersResponse = await api.getFolders();
                console.log('Folders response:', foldersResponse);
                
                if (!foldersResponse?.data) {
                    throw new Error('Invalid folders response');
                }
                
                setFolders(foldersResponse.data);

                const folderPath = location.pathname.split('/drive/')[1];
                if (folderPath) {
                    const currentFolder = foldersResponse.data?.find(f => f.name === folderPath);
                    if (currentFolder) {
                        console.log('Found folder:', currentFolder);
                        setCurrentFolder(currentFolder);
                        const filesData = await api.getFilesInFolder(currentFolder.id);
                        console.log('Files in folder:', filesData);
                        setFiles(filesData);
                    } else {
                        console.log('Folder not found:', folderPath);
                        setError(`Folder "${folderPath}" not found`);
                    }
                } else {
                    console.log('Loading root files');
                    const filesData = await api.getFilesInFolder(null);
                    console.log('Root files:', filesData);
                    setFiles(filesData);
                }
            } catch (err: any) {
                console.error('Error loading initial data:', err);
                const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load drive contents';
                setError(errorMessage);
                
                // Log additional error details
                if (err?.response) {
                    console.error('Response data:', err.response.data);
                    console.error('Response status:', err.response.status);
                    console.error('Response headers:', err.response.headers);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [location.pathname]);

    useEffect(() => {
        console.log('Files state changed:', files);
        console.log('Folders state changed:', folders);
    }, [files, folders]);

    useEffect(() => {
        if (currentFolder) {
            console.log('Current folder:', currentFolder);
        }
    }, [currentFolder]);

    const loadFoldersAndFiles = async () => {
        try {
            setIsLoading(true);
            const [foldersResponse, filesData] = await Promise.all([
                api.getFolders(),
                api.getFilesInFolder(currentFolder?.id || null)
            ]);
            
            console.log('Loaded folders:', foldersResponse);
            console.log('Loaded files:', filesData);
            
            setFolders(foldersResponse.data || []);
            setFiles(filesData);
        } catch (err) {
            setError('Failed to load drive contents');
            console.error('Load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            setIsLoading(true);
            const newFolder = await api.createFolder(newFolderName, currentFolder?.id);
            console.log('New folder created:', newFolder);
            
            // Reload the folders to get the updated list
            const foldersResponse = await api.getFolders();
            setFolders(foldersResponse.data);
            
            setShowNewFolderDialog(false);
            setNewFolderName('');
        } catch (err: any) {
            console.error('Failed to create folder:', err);
            setError(err?.response?.data?.message || 'Failed to create folder');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFolder = async (folderId: number) => {
        try {
            await api.deleteFolder(folderId);
            setFolders(folders.filter(f => f.id !== folderId));
        } catch (err) {
            setError('Failed to delete folder');
            console.error(err);
        }
    };

    const handleFolderClick = async (folder: Folder) => {
        try {
            setCurrentFolder(folder);
            navigate(`/drive/${folder.name}`);
            const filesData = await api.getFilesInFolder(folder.id);
            setFiles(filesData);
        } catch (err) {
            console.error('Error loading folder files:', err);
            setError('Failed to load folder contents');
        }
    };

    const handleNavigateUp = async () => {
        try {
            setCurrentFolder(null);
            navigate('/drive');
            const filesData = await api.getFilesInFolder(null);
            setFiles(filesData);
        } catch (err) {
            console.error('Error loading root files:', err);
            setError('Failed to load root contents');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const response = await api.uploadFile(file);
            
            // After upload, reload both folders and files
            const [foldersResponse, filesData] = await Promise.all([
                api.getFolders(),
                api.getFilesInFolder(currentFolder?.id || null)
            ]);
            
            setFolders(foldersResponse.data || []);
            setFiles(filesData);
            
        } catch (err) {
            setError('Failed to upload file');
            console.error('Upload error:', err);
        } finally {
            setIsLoading(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleDelete = async (fileId: number) => {
        try {
            setIsLoading(true);
            await api.deleteFile(fileId);
            setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
        } catch (err: any) {
            console.error('Delete error:', err);
            if (err?.response?.status === 404) {
                setError('File not found or already deleted');
            } else if (err?.response?.status === 401) {
                setError('You do not have permission to delete this file');
            } else {
                setError('Failed to delete file');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string | Date): string => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    return (
        <div className="drive-page">
            <div className="drive-header">
                <div className="header-left">
                    <div className="breadcrumb">
                        <button 
                            className="breadcrumb-item"
                            onClick={handleNavigateUp}
                            disabled={!currentFolder}
                        >
                            📁 My Files
                        </button>
                        {currentFolder && (
                            <>
                                <span className="breadcrumb-separator">/</span>
                                <span className="breadcrumb-item current">
                                    {currentFolder.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <input type="text" placeholder="Search files..." />
                        <span className="search-icon">🔍</span>
                    </div>
                    <button 
                        className="upload-button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Upload
                    </button>
                    <button 
                        className="create-new-button"
                        onClick={() => setShowNewFolderDialog(true)}
                    >
                        New folder
                    </button>
                </div>
            </div>

            <div className="drive-content">
                {showNewFolderDialog && (
                    <div className="new-folder-dialog">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder name"
                            autoFocus
                        />
                        <button onClick={handleCreateFolder}>Create</button>
                        <button onClick={() => setShowNewFolderDialog(false)}>Cancel</button>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    multiple
                />

                {error && <div className="error-message">{error}</div>}
                
                {isLoading ? (
                    <div className="loading">Loading...</div>
                ) : folders.length === 0 && files.length === 0 ? (
                    <div className="empty-drive">
                        <div className="empty-icon">📁</div>
                        <h3>Create a folder and upload files</h3>
                        <button 
                            className="create-folder-button"
                            onClick={() => setShowNewFolderDialog(true)}
                        >
                            New folder
                        </button>
                    </div>
                ) : (
                    <div className="files-container">
                        {folders
                            .filter(f => f.parentId === currentFolder?.id)
                            .map(folder => (
                                <div key={`folder-${folder.id}`} className="file-item folder-item">
                                    <div className="file-icon">📁</div>
                                    <div 
                                        className="file-info"
                                        onClick={() => handleFolderClick(folder)}
                                    >
                                        <div className="file-name">{folder.name}</div>
                                        <div className="file-meta">
                                            <span>Folder</span>
                                            <span>•</span>
                                            <span>{new Date(folder.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="file-actions">
                                        <button 
                                            className="action-button" 
                                            title="Delete"
                                            onClick={() => handleDeleteFolder(folder.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}

                        {files
                            .filter(f => {
                                console.log('Filtering file:', {
                                    fileId: f.id,
                                    fileName: f.name,
                                    fileFolderId: f.folderId,
                                    currentFolderId: currentFolder?.id,
                                    matches: f.folderId === (currentFolder?.id || null)
                                });
                                return currentFolder ? f.folderId === currentFolder.id : f.folderId === null;
                            })
                            .map(file => (
                                <div key={`file-${file.id}`} className="file-item">
                                    <div className="file-icon">
                                        {file.contentType?.startsWith('image/') ? '🖼️' : '📄'}
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name" title={file.name}>
                                            {file.name}
                                        </div>
                                        <div className="file-meta">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{formatDate(file.uploadedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="file-actions">
                                        <button className="action-button" title="Download">⬇️</button>
                                        <button className="action-button" title="Share">🔗</button>
                                        <button 
                                            className="action-button" 
                                            title="Delete" 
                                            onClick={() => handleDelete(file.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DrivePage;