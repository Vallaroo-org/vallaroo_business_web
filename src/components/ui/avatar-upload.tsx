'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, User } from 'lucide-react';
import Image from 'next/image';
import { uploadToR2 } from '@/lib/r2-upload';
import { toast } from 'sonner';

interface AvatarUploadProps {
    uid: string;
    url: string | null;
    onUpload: (url: string) => void;
    size?: number;
}

export default function AvatarUpload({ uid, url, onUpload, size = 150 }: AvatarUploadProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];

            // Upload to R2 (Folder: avatars/uid)
            const { publicUrl } = await uploadToR2(file, `avatars/${uid}`);

            onUpload(publicUrl);

        } catch (error: unknown) {
            toast.error('Error uploading avatar!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative overflow-hidden rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center group"
                style={{ width: size, height: size }}
            >
                {url ? (
                    <Image
                        src={url}
                        alt="Avatar"
                        className="object-cover w-full h-full"
                        width={size}
                        height={size}
                    />
                ) : (
                    <User className="w-1/2 h-1/2 text-gray-400" />
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {url ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <input
                    type="file"
                    id="single"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    ref={fileInputRef}
                    className="hidden"
                />
            </div>
        </div>
    );
}
