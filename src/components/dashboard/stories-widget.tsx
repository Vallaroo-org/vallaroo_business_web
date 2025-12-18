'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Story } from '@/lib/types';
import { Loader2, Plus, Trash2, Image as ImageIcon, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import dynamic from 'next/dynamic';
import { uploadToR2 } from '@/lib/r2-upload';

const StoryEditorModal = dynamic(
    () => import('./story-editor-modal').then((mod) => mod.StoryEditorModal),
    { ssr: false }
);
const StoryDetailModal = dynamic(
    () => import('./story-detail-modal').then((mod) => mod.StoryDetailModal),
    { ssr: false }
);

interface StoriesWidgetProps {
    shopId: string;
    subscriptionPlan?: string | null;
}

// Extended type for analytics
interface StoryWithAnalytics extends Story {
    story_views: { count: number }[];
}

export function StoriesWidget({ shopId, subscriptionPlan }: StoriesWidgetProps) {
    const { t } = useLanguage();
    const [stories, setStories] = useState<StoryWithAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Editor State
    const [editingFile, setEditingFile] = useState<File | null>(null);
    const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

    // Detail/Analytics State
    const [selectedStory, setSelectedStory] = useState<StoryWithAnalytics | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const limit = subscriptionPlan === 'pro' ? 25 : 5;
    const canAdd = stories.length < limit;

    const fetchStories = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*, story_views(count)')
                .eq('shop_id', shopId)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            // @ts-ignore
            setStories(data || []);
        } catch (error) {
            console.error('Error fetching stories:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shopId) {
            fetchStories();
        }
    }, [shopId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setEditingFile(file);
                setEditingImageUrl(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCloseEditor = () => {
        setEditingFile(null);
        setEditingImageUrl(null);
    };

    const handleSaveEditedImage = async (editedBlob: Blob) => {
        setEditingFile(null); // Close modal efficiently
        setUploading(true);

        try {
            // 1. Upload to R2
            const fileExt = editedBlob.type.split('/')[1] || 'png';
            const file = new File([editedBlob], `story.${fileExt}`, { type: editedBlob.type });
            const { publicUrl } = await uploadToR2(file, `stories/${shopId}`);

            // 2. Insert into Table
            const { error: dbError } = await supabase
                .from('stories')
                .insert({
                    shop_id: shopId,
                    media_url: publicUrl,
                    media_type: 'image',
                });

            if (dbError) throw dbError;

            await fetchStories();
        } catch (error) {
            console.error('Error uploading story:', error);
            alert('Failed to upload story');
        } finally {
            setUploading(false);
            setEditingImageUrl(null);
        }
    };

    const handleDelete = async (storyId: string, mediaUrl: string) => {
        // Confirmation is now handled in the modal, but keeping this signature for flexibility
        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('stories')
                .delete()
                .eq('id', storyId);

            if (dbError) throw dbError;

            // 2. Delete from Storage (Optional cleanup, good practice)
            try {
                const url = new URL(mediaUrl);
                const pathParts = url.pathname.split('/stories/');
                if (pathParts.length > 1) {
                    await supabase.storage.from('stories').remove([pathParts[1]]);
                }
            } catch (e) {
                console.warn('Could not cleanup storage file', e);
            }

            setStories(prev => prev.filter(s => s.id !== storyId));

            // Close modal if open
            if (selectedStory?.id === storyId) {
                setSelectedStory(null);
            }
        } catch (error) {
            console.error('Error deleting story:', error);
            alert('Failed to delete story');
            throw error; // Re-throw to let modal know
        }
    };

    if (loading) return <div className="h-24 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

    return (
        <>
            <div className="bg-card border border-border shadow-sm rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-foreground">
                        Shop Stories
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${stories.length >= limit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {stories.length}/{limit} Active
                    </span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Add Button */}
                    <div className="flex-shrink-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={!canAdd || uploading}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!canAdd || uploading}
                            className={`w-20 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors
                                ${!canAdd ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' :
                                    uploading ? 'border-primary/50 bg-primary/5 cursor-wait' :
                                        'border-gray-300 hover:border-primary hover:bg-primary/5'}`}
                        >
                            {uploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            ) : (
                                <>
                                    <Plus className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Add Story</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Story List */}
                    {stories.map(story => (
                        <div key={story.id} className="relative w-20 h-32 flex-shrink-0 group cursor-pointer" onClick={() => setSelectedStory(story)}>
                            <div className="w-full h-full rounded-lg overflow-hidden border border-border bg-gray-100 relative">
                                <img
                                    src={(() => {
                                        const url = story.media_url;
                                        if (url.includes('/storage/v1/object/public/')) {
                                            return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=300&height=480&resize=cover`;
                                        }
                                        return url;
                                    })()}
                                    alt="Story"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                {/* View Count Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[1px] py-1 flex justify-center items-center gap-1">
                                    <Eye className="w-3 h-3 text-white" />
                                    <span className="text-[10px] text-white font-medium">
                                        {story.story_views?.[0]?.count || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {stories.length === 0 && (
                        <div className="flex items-center text-sm text-muted-foreground italic pl-4">
                            No active stories
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Modal */}
            {editingImageUrl && (
                <StoryEditorModal
                    imageUrl={editingImageUrl}
                    onSave={handleSaveEditedImage}
                    onClose={handleCloseEditor}
                />
            )}

            {/* Detail/Analytics Modal */}
            {selectedStory && (
                <StoryDetailModal
                    storyId={selectedStory.id}
                    mediaUrl={selectedStory.media_url}
                    onClose={() => setSelectedStory(null)}
                    onDelete={handleDelete}
                />
            )}
        </>
    );
}
