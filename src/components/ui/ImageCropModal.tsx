import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '@/utils/cropImage';

interface ImageCropModalProps {
    imageSrc: string;
    onCropComplete: (croppedFile: File) => void;
    onClose: () => void;
    aspectRatio?: number;
    cropShape?: 'rect' | 'round';
    title?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
    imageSrc,
    onCropComplete,
    onClose,
    aspectRatio,
    cropShape = 'rect',
}) => {
    // Default to undefined so it doesn't draw a distorted crop box initially.
    // If the user doesn't draw one, it falls back to the full image.
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        
        if (aspectRatio === 1) {
            // Calculate a perfectly centered square crop in percentages for the Avatar
            const minDim = Math.min(width, height);
            const cropSize = minDim * 0.8; // 80% of the smallest dimension
            const widthPct = (cropSize / width) * 100;
            const heightPct = (cropSize / height) * 100;
            
            setCrop({
                unit: '%',
                x: (100 - widthPct) / 2,
                y: (100 - heightPct) / 2,
                width: widthPct,
                height: heightPct
            });
        } else {
            // For cover photos, inset by 5% on all sides so the user clearly sees the crop handles
            setCrop({
                unit: '%',
                x: 5,
                y: 5,
                width: 90,
                height: 90
            });
        }
    };

    const handleConfirm = async () => {
        if (!imgRef.current) return;
        
        let finalPercentCrop = completedCrop || crop;
        // If they didn't interact with the crop box, fallback to 100% of the image
        if (!finalPercentCrop || finalPercentCrop.width === 0 || finalPercentCrop.height === 0) {
            finalPercentCrop = {
                unit: '%',
                x: 0,
                y: 0,
                width: 100,
                height: 100
            };
        }

        // Convert percentage crop to NATURAL pixel dimensions of the original image
        const naturalCrop = {
            x: (finalPercentCrop.x / 100) * imgRef.current.naturalWidth,
            y: (finalPercentCrop.y / 100) * imgRef.current.naturalHeight,
            width: (finalPercentCrop.width / 100) * imgRef.current.naturalWidth,
            height: (finalPercentCrop.height / 100) * imgRef.current.naturalHeight,
        };

        try {
            setIsCropping(true);
            const croppedFile = await getCroppedImg(imageSrc, naturalCrop);
            if (croppedFile) {
                onCropComplete(croppedFile);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            {/* The Image Cropper Container */}
            <div className="relative w-full max-w-[95vw] md:max-w-5xl h-[60vh] md:h-[75vh] flex items-center justify-center overflow-hidden drop-shadow-2xl">
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                    aspect={aspectRatio}
                    circularCrop={cropShape === 'round'}
                    className="max-h-full max-w-full flex items-center justify-center"
                >
                    <img 
                        ref={imgRef}
                        alt="Crop me" 
                        src={imageSrc} 
                        onLoad={onImageLoad}
                        className="max-h-[60vh] md:max-h-[75vh] max-w-full w-auto object-contain rounded-lg md:rounded-2xl"
                    />
                </ReactCrop>
            </div>

            {/* Floating Controls Pill */}
            <div className="mt-6 md:mt-8 bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 md:p-2 rounded-full shadow-2xl flex items-center gap-1 md:gap-2 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-[280px] md:max-w-[340px] justify-between">
                <button
                    onClick={onClose}
                    disabled={isCropping}
                    className="px-4 py-2.5 md:px-6 md:py-3 rounded-full text-zinc-300 font-medium hover:text-white hover:bg-white/10 transition-all text-sm md:text-base w-full"
                >
                    Cancel
                </button>
                <div className="w-[1px] h-6 md:h-8 bg-white/20 shrink-0"></div>
                <button
                    onClick={handleConfirm}
                    disabled={isCropping}
                    className="px-4 py-2.5 md:px-8 md:py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 text-sm md:text-base w-full whitespace-nowrap"
                >
                    {isCropping ? (
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    Apply Crop
                </button>
            </div>
        </div>
    );
};
