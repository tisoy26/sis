export type EventImage = {
    id: number;
    url: string;
};

export type Event = {
    id: number;
    title: string;
    body: string;
    event_date: string | null;
    location: string | null;
    images: EventImage[];
    status: 'published' | 'draft';
    created_by_name: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
};
