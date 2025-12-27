'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, QrCode } from 'lucide-react';
import Image from 'next/image';
import { uploadToR2 } from '@/lib/r2-upload';
import { toast } from 'sonner';

interface QRCodeUploadProps {
    shopId: string;
    url: string | null;
    onUpload: (url: string) => void;
}

export function QRCodeUpload({ shopId, url, onUpload }: QRCodeUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            // Upload to R2 (Folder: shops/shopId/qr)
            const { publicUrl } = await uploadToR2(file, `shops/${shopId}/qr`);

            onUpload(publicUrl);
            toast.success("QR Code uploaded successfully");

        } catch (error: any) {
            toast.error('Error uploading QR Code. Please try again.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div
                className="relative overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center group rounded-lg"
                style={{ width: 200, height: 200 }}
            >
                {url ? (
                    <Image
                        src={url}
                        alt="QR Code"
                        className="object-contain w-full h-full p-2"
                        width={200}
                        height={200}
                    />
                ) : (
                    <div className="flex flex-col items-center text-muted-foreground gap-2">
                        <QrCode className="w-12 h-12" />
                        <span className="text-xs">No QR Code</span>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                )}
            </div>

            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {url ? 'Change QR' : 'Upload QR'}
                </Button>
                <input
                    type="file"
                    id="qr-upload"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    ref={fileInputRef}
                    className="hidden"
                />
            </div>
        </div>
    );
}
