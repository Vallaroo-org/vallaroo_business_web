import { createClient } from '@/lib/supabase/client';

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

    // 1. Get Presigned URL from Edge Function
    const { data, error } = await supabase.functions.invoke('storage-upload', {
        body: {
            filename: customFilename || file.name,
            fileType: file.type,
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

    // 2. Upload to R2 using the Presigned URL
    const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
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
