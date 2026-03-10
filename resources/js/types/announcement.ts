export type Announcement = {
    id: number;
    title: string;
    body: string;
    image_url: string | null;
    status: 'published' | 'draft';
    created_by_name: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
};
