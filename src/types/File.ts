export interface DriveFile {
    id: number;
    name: string;
    size: number;
    type: string;
    userId: number;
    url: string;
    createdAt: Date;
    isPublic: boolean;
    folderId: number | null;
}

export interface Folder {
    id: number;
    name: string;
    userId: number;
    createdAt: Date;
    parentId: number | null;
}

export interface FileUploadResponse {
    id: number;
    url: string;
    name: string;
}

export interface CreateFolderResponse {
    id: number;
    name: string;
    createdAt: Date;
} 