'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
// @ts-ignore
import { X, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ConfirmationDialog from '../ui/confirmation-dialog';

interface StoryDetailModalProps {
    storyId: string;
    mediaUrl: string;
    onClose: () => void;
    onDelete: (id: string, url: string) => Promise<void>;
}

interface Viewer {
    viewed_at: string;
    user: {
        id: string;
        display_name: string | null;
        display_name_ml: string | null;
        email: string | null;
        profile_image_url: string | null;
    } | null;
}

export function StoryDetailModal({ storyId, mediaUrl, onClose, onDelete }: StoryDetailModalProps) {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchViewers = async () => {
            console.log('Fetching viewers for story:', storyId);
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                console.log('Current Auth User:', currentUser?.id);

                const { data, error } = await supabase
                    .from('story_views')
                    .select(`
                        viewed_at,
                        user:user_profiles (
                            id,
                            display_name,
                            display_name_ml,
                            email,
                            profile_image_url
                        )
                    `)
                    .eq('story_id', storyId)
                    .order('viewed_at', { ascending: false });

                if (error) {
                    console.error('Supabase Error fetching viewers:', error);
                    throw error;
                }

                console.log('Fetched Viewers Data:', data);
                // @ts-ignore
                setViewers(data || []);
            } catch (error) {
                console.error('Error fetching viewers:', error);
            } finally {
                setLoading(false);
            }
        };

        if (storyId) {
            fetchViewers();

            // Realtime Subscription
            const channel = supabase
                .channel('story_viewers')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'story_views',
                        filter: `story_id=eq.${storyId}`
                    },
                    async (payload) => {
                        console.log('Realtime update received:', payload);
                        if (payload.eventType === 'INSERT') {
                            const newView = payload.new as { viewer_id: string; viewed_at: string };
                            // Fetch only the new user's profile
                            const { data: userData, error } = await supabase
                                .from('user_profiles')
                                .select('id, display_name, display_name_ml, email, profile_image_url')
                                .eq('id', newView.viewer_id)
                                .single();

                            if (!error && userData) {
                                setViewers((prev) => {
                                    // Avoid duplicates just in case
                                    if (prev.some(v => v.user?.id === userData.id)) return prev;
                                    return [{
                                        viewed_at: newView.viewed_at,
                                        user: userData
                                    }, ...prev];
                                });
                            }
                        } else {
                            // For DELETE or UPDATE, full refresh is safer/easier
                            fetchViewers();
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [storyId]);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(storyId, mediaUrl);
            onClose();
        } catch (error) {
            console.error('Failed to delete', error);
            setDeleting(false);
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[60] p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col md:flex-row w-full max-w-5xl h-[85vh] bg-background rounded-xl overflow-hidden shadow-2xl">
                {/* Left: Image */}
                <div className="w-full md:w-2/3 h-1/2 md:h-full bg-black flex items-center justify-center relative group">
                    <img
                        src={(() => {
                            if (mediaUrl.includes('/storage/v1/object/public/')) {
                                return `${mediaUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=1280&height=1280&resize=contain`;
                            }
                            return mediaUrl;
                        })()}
                        alt="Story Detail"
                        className="max-w-full max-h-full object-contain"
                    />

                    {/* Floating Actions on Image */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            onClick={handleDeleteClick}
                            disabled={deleting}
                            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right: Analytics */}
                <div className="w-full md:w-1/3 h-1/2 md:h-full border-l border-border bg-card flex flex-col">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Eye className="w-5 h-5 text-gray-400" />
                            Story Views
                        </h3>
                        <span className="text-sm font-medium bg-secondary px-2 py-1 rounded-full">
                            {viewers.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-4 text-muted-foreground">Loading...</div>
                        ) : viewers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">
                                No views yet
                            </div>
                        ) : (
                            viewers.map((item, index) => {
                                const user = item.user;
                                return (
                                    <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-border">
                                            {user?.profile_image_url ? (
                                                <img
                                                    src={(() => {
                                                        const url = user.profile_image_url;
                                                        if (url && url.includes('/storage/v1/object/public/')) {
                                                            return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=100&height=100&resize=cover`;
                                                        }
                                                        return url || '';
                                                    })()}
                                                    alt={user.display_name || 'User'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                                    {(user?.display_name?.[0] || 'U').toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {user?.display_name || user?.email || 'Unknown User'}
                                                {user?.display_name_ml && <span className="text-xs text-muted-foreground ml-1">({user.display_name_ml})</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(item.viewed_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Story"
                description="Are you sure you want to delete this story? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="destructive"
            />
        </div>
    );
}
