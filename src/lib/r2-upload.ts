import { createClient } from '@/lib/supabase/client';
import { compressImage } from './image-compression';

export interface R2UploadResult {
    publicUrl: string;
    objectKey: string;
}

export async function uploadToR2(
    file: File,
    folder: string = 'uploads',
    customFilename?: string
): Promise<R2UploadResult> {
    const supabase = createClient();

    // 1. Compress Image (if it's an image)
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
    }

    // 2. Get Presigned URL from Edge Function
    const { data, error } = await supabase.functions.invoke('storage-upload', {
        body: {
            filename: customFilename || fileToUpload.name,
            fileType: fileToUpload.type,
            folder,
        },
    });

    if (error) {
        console.error('Edge Function Error:', error);
        throw new Error(`Failed to get upload URL: ${error.message}`);
    }

    if (!data?.uploadUrl || !data?.publicUrl) {
        console.error('Invalid Edge Function Response:', data);
        throw new Error('Invalid response from upload signer');
    }

    // 3. Upload to R2 using the Presigned URL
    console.log('Uploading to R2 Presigned URL:', data.uploadUrl);

    const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: fileToUpload,
        headers: {
            'Content-Type': fileToUpload.type,
        },
    });

    if (!uploadResponse.ok) {
        console.error('R2 Upload Failed:', await uploadResponse.text());
        throw new Error(`Failed to upload to storage: ${uploadResponse.statusText}`);
    }

    return {
        publicUrl: data.publicUrl,
        objectKey: data.objectKey
    };
}
