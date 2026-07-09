export interface IListItem {
    tmdbId: string;
    mediaType: 'movie' | 'tv';
    addedAt: string;
}

export interface IList {
    id: string;
    userId: string;
    name: string;
    description?: string;
    items: IListItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateListDTO {
    name: string;
    description?: string;
}

export interface UpdateListDTO {
    name?: string;
    description?: string;
}

export interface AddListItemDTO {
    tmdbId: string;
    mediaType: 'movie' | 'tv';
}

export interface RemoveListItemDTO {
    tmdbId: string;
    mediaType: 'movie' | 'tv';
}
