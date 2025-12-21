import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.3, // <300KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp'
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Ensure extension is .webp
        if (!compressedFile.name.toLowerCase().endsWith('.webp')) {
            const newName = compressedFile.name.substring(0, compressedFile.name.lastIndexOf('.')) + '.webp';
            return new File([compressedFile], newName, { type: 'image/webp' });
        }
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original if compression fails
    }
}
