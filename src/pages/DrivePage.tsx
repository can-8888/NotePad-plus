import React, { useState, useEffect, useRef } from 'react';
import { DriveFile, Folder } from '../types/File';
import { api } from '../services/api';
import './DrivePage.css';

const DrivePage: React.FC = () => {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadFoldersAndFiles();
    }, [currentFolder]);

    const loadFoldersAndFiles = async () => {
        try {
            setIsLoading(true);
            const [foldersData, filesData] = await Promise.all([
                api.getFolders(),
                api.getFilesInFolder(currentFolder?.id || null)
            ]);
            setFolders(foldersData);
            setFiles(filesData);
        } catch (err) {
            setError('Failed to load drive contents');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const newFolder = await api.createFolder(newFolderName, currentFolder?.id);
            setFolders(prev => [...prev, newFolder]);
            setShowNewFolderDialog(false);
            setNewFolderName('');
        } catch (err) {
            setError('Failed to create folder');
            console.error(err);
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

    const handleFolderClick = (folder: Folder) => {
        setCurrentFolder(folder);
    };

    const handleNavigateUp = () => {
        setCurrentFolder(null);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const response = await api.uploadFile(file);
            setFiles(prev => [...prev, {
                id: response.id,
                name: response.name,
                url: response.url,
                size: file.size,
                type: file.type,
                userId: 0, // Will be set by server
                createdAt: new Date(),
                isPublic: false,
                folderId: currentFolder?.id || null
            }]);
        } catch (err) {
            setError('Failed to upload file');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (fileId: number) => {
        try {
            await api.deleteFile(fileId);
            setFiles(files.filter(f => f.id !== fileId));
        } catch (err) {
            setError('Failed to delete file');
            console.error(err);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                    <button className="create-new-button">
                        Create new +
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

                {files.length === 0 && !isLoading && (
                    <div className="empty-drive">
                        <div className="empty-icon">📁</div>
                        <h3>Create a folder and upload files</h3>
                        <button 
                            className="create-folder-button"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Create new folder +
                        </button>
                        <div className="tips">
                            <p>A few tips to start:</p>
                            <ol>
                                <li>Each folder and file has a link</li>
                                <li>Install apps and backup automatically</li>
                                <li>Change the access rights of the link to "Private" or set a password</li>
                                <li>Disable ads by subscribing to PRO</li>
                            </ol>
                        </div>
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
                ) : (
                    <div className="files-list">
                        {folders
                            .filter(f => f.parentId === currentFolder?.id)
                            .map(folder => (
                                <div key={folder.id} className="file-item folder-item">
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
                            .filter(f => f.folderId === currentFolder?.id)
                            .map(file => (
                                <div key={file.id} className="file-item">
                                    <div className="file-icon">
                                        {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name">{file.name}</div>
                                        <div className="file-meta">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="file-actions">
                                        <button className="action-button" title="Download">⬇️</button>
                                        <button className="action-button" title="Share">🔗</button>
                                        <button className="action-button" title="Delete" onClick={() => handleDelete(file.id)}>
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