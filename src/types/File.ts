export interface DriveFile {
    id: number;
    name: string;
    size: number;
    contentType: string;
    userId: number;
    url: string;
    uploadedAt: string;
    isPublic: boolean;
    folderId: number | null;
    path?: string;
}

export interface Folder {
    id: number;
    name: string;
    userId: number;
    createdAt: string | Date;
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