'use client';

import React, { useState } from 'react';
import FilerobotImageEditor, {
    TABS,
    TOOLS,
} from 'react-filerobot-image-editor';
// @ts-ignore
import { X } from 'lucide-react';

interface StoryEditorModalProps {
    imageUrl: string;
    onSave: (editedImageBlob: Blob) => void;
    onClose: () => void;
}

export function StoryEditorModal({ imageUrl, onSave, onClose }: StoryEditorModalProps) {
    const [isSaving, setIsSaving] = useState(false);

    // Workaround for Filerobot/React 19 issue
    if (typeof window !== 'undefined' && !(window as any).React) {
        (window as any).React = React;
    }

    const handleSave = (imageData: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setIsSaving(true);
        // Convert base64/blob to Blob if needed, but Filerobot usually returns an object with imageBase64 or similar
        // We will fetch the object URL or base64 to create a proper blob

        try {
            // The imageData object contains:
            // { name, extension, mimeType, fullName, imageBase64, ... }
            if (imageData.imageBase64) {
                fetch(imageData.imageBase64)
                    .then(res => res.blob())
                    .then(blob => {
                        onSave(blob);
                    });
            }
        } catch (e) {
            console.error("Error saving image", e);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full h-full md:w-[90vw] md:h-[90vh] bg-background md:rounded-xl overflow-hidden shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[60] p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <FilerobotImageEditor
                    source={imageUrl}
                    onSave={(editedImageObject, designState) => {
                        handleSave(editedImageObject);
                    }}
                    onClose={onClose}
                    useBackendTranslations={false}
                    annotationsCommon={{
                        fill: '#ff0000',
                    }}
                    Text={{ text: 'Vallaroo Story' }}
                    Rotate={{ angle: 90, componentType: 'slider' }}
                    tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE]} // Removed WATERMARK usually
                    defaultTabId={TABS.ANNOTATE}
                    defaultToolId={TOOLS.TEXT}
                    savingPixelRatio={2}
                    previewPixelRatio={2}
                />
            </div>
            {isSaving && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 text-white">
                    <div className="animate-pulse text-xl font-bold">Processing Image...</div>
                </div>
            )}
        </div>
    );
}
