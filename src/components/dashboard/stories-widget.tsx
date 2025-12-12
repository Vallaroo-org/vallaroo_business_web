'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Story } from '@/lib/types';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface StoriesWidgetProps {
    shopId: string;
    subscriptionPlan?: string | null;
}

export function StoriesWidget({ shopId, subscriptionPlan }: StoriesWidgetProps) {
    const { t } = useLanguage();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const limit = subscriptionPlan === 'pro' ? 25 : 5;
    const canAdd = stories.length < limit;

    const fetchStories = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('shop_id', shopId)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStories(data || []);
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shopId) {
            fetchStories();
        }
    }, [shopId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${shopId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('stories')
                .getPublicUrl(filePath);

            // 3. Insert into Table
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
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (storyId: string, mediaUrl: string) => {
        if (!confirm('Delete this story?')) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('stories')
                .delete()
                .eq('id', storyId);

            if (dbError) throw dbError;

            // 2. Delete from Storage (Optional cleanup, good practice)
            // Extract path from URL roughly
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
        } catch (error) {
            console.error('Error deleting story:', error);
            alert('Failed to delete story');
        }
    };

    if (loading) return <div className="h-24 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

    return (
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
                        onChange={handleFileUpload}
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
                    <div key={story.id} className="relative w-20 h-32 flex-shrink-0 group">
                        <div className="w-full h-full rounded-lg overflow-hidden border border-border bg-gray-100">
                            <img
                                src={story.media_url}
                                alt="Story"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={() => handleDelete(story.id, story.media_url)}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                            <Trash2 className="w-3 h-3 text-white" />
                        </button>
                    </div>
                ))}

                {stories.length === 0 && (
                    <div className="flex items-center text-sm text-muted-foreground italic pl-4">
                        No active stories
                    </div>
                )}
            </div>
        </div>
    );
}
