/*  */'use client';

import React, { useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setUser, logoutUser } from '@/store/slices/authSlice';
import { profileService } from '../api/profile.service';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const ProfileHeader = () => {
    const { user } = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const { isInstallable, promptInstall } = usePWAInstall();
    
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    // Optimistic preview: show local image immediately before Cloudinary upload finishes
    const [optimisticAvatar, setOptimisticAvatar] = useState<string | null>(null);
    const [optimisticCover, setOptimisticCover] = useState<string | null>(null);
    
    // Inline editing states
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    // Toast notification state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsEditMode(false);
        setIsCoverMenuOpen(false);
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setCropType('avatar');
        };
        reader.readAsDataURL(file);
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsEditMode(false);
        setIsCoverMenuOpen(false);
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setCropType('cover');
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedFile: File) => {
        setCropImageSrc(null);
        const currentType = cropType;
        setCropType(null);

        //  Optimistic preview: show the local image INSTANTLY before upload
        const blobUrl = URL.createObjectURL(croppedFile);
        if (currentType === 'avatar') {
            setOptimisticAvatar(blobUrl);
            setIsUploadingAvatar(true);
        } else if (currentType === 'cover') {
            setOptimisticCover(blobUrl);
            setIsUploadingCover(true);
        }

        try {
            if (currentType === 'avatar') {
                const updatedUser = await profileService.uploadAvatar(croppedFile);
                dispatch(setUser(updatedUser));
            } else if (currentType === 'cover') {
                const updatedUser = await profileService.uploadCoverPhoto(croppedFile);
                dispatch(setUser(updatedUser));
            }
        } catch (error: any) {
            console.error(`Failed to upload ${currentType}`, error);
            showToast(error.response?.data?.message || `Failed to upload ${currentType}`);
        } finally {
            // Clean up blob URL from memory and clear optimistic state
            URL.revokeObjectURL(blobUrl);
            if (currentType === 'avatar') {
                setOptimisticAvatar(null);
                setIsUploadingAvatar(false);
            }
            if (currentType === 'cover') {
                setOptimisticCover(null);
                setIsUploadingCover(false);
            }
            if (avatarInputRef.current) avatarInputRef.current.value = '';
            if (coverInputRef.current) coverInputRef.current.value = '';
        }
    };

    const handleDeleteAvatar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const updatedUser = await profileService.deleteAvatar();
            dispatch(setUser(updatedUser));
        } catch (error: any) {
            console.error('Failed to delete avatar', error);
            showToast(error.response?.data?.message || 'Failed to delete avatar');
        }
    };

    const handleDeleteCover = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditMode(false);
        setIsCoverMenuOpen(false);
        try {
            const updatedUser = await profileService.deleteCoverPhoto();
            dispatch(setUser(updatedUser));
        } catch (error: any) {
            console.error('Failed to delete cover photo', error);
            showToast(error.response?.data?.message || 'Failed to delete cover photo');
        }
    };

    const handleSaveUsername = async () => {
        const trimmed = usernameInput.trim();
        if (!trimmed || trimmed === (user.username || user.name)) {
            setIsEditingUsername(false);
            return;
        }

        // Frontend validation
        if (trimmed.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            return;
        }
        if (trimmed.length > 25) {
            setUsernameError('Username cannot exceed 25 characters');
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            setUsernameError('Only letters, numbers, _ and - allowed');
            return;
        }

        setUsernameError(null);

        try {
            setIsSavingUsername(true);
            const updatedUser = await profileService.updateProfileDetails({
                username: trimmed
            });
            dispatch(setUser(updatedUser));
            setIsEditingUsername(false);
        } catch (error: any) {
            console.error('Failed to update username', error);
            showToast(error.response?.data?.message || 'Failed to update username');
        } finally {
            setIsSavingUsername(false);
        }
    };
    return (
        <>
            {/* ── Logout Confirmation Modal ── */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6"
                    style={{ animation: 'tvtrac-fadeIn 0.3s ease forwards' }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md transition-opacity"
                        onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
                    />
                    {/* Dialog */}
                    <div
                        className="glass-panel relative z-10 w-full max-w-sm mx-auto rounded-3xl overflow-hidden flex flex-col items-center p-8 text-center"
                        style={{ animation: 'tvtrac-slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                    >
                        {/* Glow effect behind icon */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full pointer-events-none" />

                        {/* Icon */}
                        <div className="relative w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                            <svg className="w-8 h-8 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>

                        {/* Text */}
                        <h2 className="text-xl font-semibold text-slate-50 mb-3 tracking-tight">Sign out of TVTrac?</h2>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-[260px]">
                            You will be securely signed out. Your favorites and watch history are safely stored.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={async () => {
                                    setIsLoggingOut(true);
                                    await dispatch(logoutUser());
                                    setIsLoggingOut(false);
                                    setShowLogoutConfirm(false);
                                    router.replace("/");
                                }}
                                disabled={isLoggingOut}
                                className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-[15px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                        Signing out...
                                    </>
                                ) : (
                                    'Yes, sign out'
                                )}
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="w-full py-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 text-[15px] font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* CSS keyframes injected inline */}
                        <style>{`
                            @keyframes tvtrac-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes tvtrac-slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
                        `}</style>
                    </div>
                </div>
            )}

        <div className="w-full relative min-h-[160px] sm:min-h-[300px] md:min-h-[450px] lg:min-h-[600px] flex flex-col justify-end pb-6 md:pb-8">
            {cropImageSrc && cropType && (
                <ImageCropModal
                    imageSrc={cropImageSrc}
                    aspectRatio={cropType === 'avatar' ? 1 : undefined}
                    cropShape={cropType === 'avatar' ? 'round' : 'rect'}
                    title={cropType === 'avatar' ? 'Crop Profile Photo' : 'Crop Cover Photo'}
                    onCropComplete={handleCropComplete}
                    onClose={() => {
                        setCropImageSrc(null);
                        setCropType(null);
                        if (avatarInputRef.current) avatarInputRef.current.value = '';
                        if (coverInputRef.current) coverInputRef.current.value = '';
                    }}
                />
            )}

            {/* Custom Toast Notification */}
            {toastMessage && (
                <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-[#111] text-zinc-200 px-4 pr-6 py-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] font-medium flex items-center gap-3 border border-zinc-800 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                        <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[13px] leading-tight whitespace-nowrap">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* Background Cover Photo with gradient fade */}
            <div className="absolute inset-0 w-full h-full group/cover">
                {optimisticCover || user.coverPhoto ? (
                    <Image
                        src={optimisticCover || user.coverPhoto!} 
                        alt="Cover" 
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-center"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-[#111]"></div>
                )}
                
                {/* Subtle bottom fade just for text readability, removing the aggressive dimming */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent"></div>

                {/* Cover Photo Upload Spinner */}
                {isUploadingCover && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Global Click-Away for Edit Mode */}
                {(isEditMode || isCoverMenuOpen) && (
                    <div 
                        className="fixed inset-0 z-20 cursor-pointer" 
                        onClick={() => {
                            setIsEditMode(false);
                            setIsCoverMenuOpen(false);
                        }}
                    />
                )}

                {/* Cover Photo Top Right Actions */}
                <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
                    {/* 3-Dot Toggle Button */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEditMode) {
                                setIsEditMode(false);
                            } else {
                                setIsCoverMenuOpen(!isCoverMenuOpen);
                            }
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors border shadow-xl ${isCoverMenuOpen || isEditMode ? 'bg-[#222] border-zinc-700 text-white' : 'bg-[#111] border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#222]'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {/* Edit Option Dropdown */}
                    {isCoverMenuOpen && !isEditMode && (
                        <div className="w-48 bg-[#111] border border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 z-40">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsCoverMenuOpen(false);
                                    setIsEditMode(true);
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsCoverMenuOpen(false);
                                    setIsEditMode(true);
                                }}
                                className="px-4 py-3 text-sm text-left hover:bg-zinc-800 transition-colors flex items-center gap-3 text-white"
                            >
                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Profile
                            </button>
                            {isInstallable && (
                                <>
                                    <div className="h-px bg-zinc-800 mx-3" />
                                    <button 
                                        type="button"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsCoverMenuOpen(false);
                                            await promptInstall();
                                        }}
                                        onTouchEnd={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsCoverMenuOpen(false);
                                            await promptInstall();
                                        }}
                                        className="px-4 py-3 text-sm text-left hover:bg-zinc-800 transition-colors flex items-center gap-3 text-white"
                                    >
                                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Install App
                                    </button>
                                </>
                            )}
                            <div className="h-px bg-zinc-800 mx-3" />
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsCoverMenuOpen(false);
                                    setShowLogoutConfirm(true);
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsCoverMenuOpen(false);
                                    setShowLogoutConfirm(true);
                                }}
                                className="px-4 py-3 text-sm text-left hover:bg-red-950/40 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}

                    {/* Edit Mode Action Buttons */}
                    {isEditMode && (
                        <div className="flex flex-col items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                            <button 
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                disabled={isUploadingCover}
                                className="w-10 h-10 flex items-center justify-center bg-[#111] hover:bg-[#222] rounded-full text-white transition-colors border border-zinc-800 shadow-xl"
                                title="Change Cover"
                            >
                                {isUploadingCover ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>

                            {user.coverPhoto && !isUploadingCover && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        handleDeleteCover(e);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-red-950/40 hover:bg-red-900/60 rounded-full text-red-500 transition-colors border border-red-900/50 shadow-xl"
                                    title="Delete Cover"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <input 
                    type="file" 
                    ref={coverInputRef} 
                    onChange={handleCoverChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            {/* Profile Info Foreground */}
            <div className="relative z-30 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-32 sm:mt-48 md:mt-64">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5 md:gap-8">
                        {/* Avatar */}
                        <div className="relative group/avatar shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-xl">
                            {optimisticAvatar || user.avatar ? (
                                <Image
                                    src={optimisticAvatar || user.avatar!}
                                    alt={user.username || user.name || 'Avatar'}
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 96px, 128px"
                                    className="object-cover rounded-full" 
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-500 font-bold rounded-full">
                                    {(user.username || user.name).charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Spinner Overlay */}
                            {isUploadingAvatar && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full z-20">
                                    <div className="w-6 h-6 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* Upload Button Overlay */}
                            {!isUploadingAvatar && isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 w-7 h-7 md:w-8 md:h-8 bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30 border-2 border-[#0a0a0a] animate-in fade-in zoom-in"
                                    title="Change avatar"
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            )}

                            {/* Delete Avatar Overlay */}
                            {!isUploadingAvatar && user.avatar && isEditMode && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-10 animate-in fade-in">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAvatar(e); }}
                                        className="p-2.5 bg-red-950/80 hover:bg-red-900/90 text-red-400 hover:text-red-200 rounded-full shadow-lg border border-red-900/50"
                                        title="Delete avatar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <input 
                                type="file" 
                                ref={avatarInputRef} 
                                onChange={handleAvatarChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>

                        {/* Name and Join Date */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                {isEditingUsername ? (
                                    <div className="flex flex-col gap-1 animate-in fade-in">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={usernameInput}
                                                onChange={(e) => {
                                                    setUsernameInput(e.target.value);
                                                    setUsernameError(null);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                                                disabled={isSavingUsername}
                                                autoFocus
                                                maxLength={25}
                                                className={`bg-transparent border-b-2 ${usernameError ? 'border-red-500' : 'border-white/20 focus:border-white'} text-white px-1 py-1 text-xl sm:text-2xl md:text-4xl font-bold w-36 sm:w-48 md:w-64 focus:outline-none transition-colors`}
                                            />
                                            <button
                                                onClick={handleSaveUsername}
                                                disabled={isSavingUsername}
                                                className="p-2 bg-green-950/60 text-green-500 hover:bg-green-900/80 rounded-full transition-colors border border-green-900/50 shadow-xl"
                                                title="Save"
                                            >
                                                {isSavingUsername ? (
                                                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setIsEditingUsername(false); setUsernameError(null); }}
                                                disabled={isSavingUsername}
                                                className="p-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-full transition-colors border border-zinc-800 shadow-xl"
                                                title="Cancel"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Character counter and error */}
                                        <div className="flex items-center justify-between px-1">
                                            {usernameError ? (
                                                <span className="text-xs text-red-400">{usernameError}</span>
                                            ) : (
                                                <span className="text-xs text-zinc-500">3–25 characters · letters, numbers, _ -</span>
                                            )}
                                            <span className={`text-xs ml-2 ${usernameInput.length > 22 ? 'text-red-400' : 'text-zinc-500'}`}>
                                                {usernameInput.length}/25
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                                            {user.username || user.name}
                                        </h1>
                                        {isEditMode && (
                                            <button
                                                onClick={() => {
                                                    setUsernameInput(user.username || user.name);
                                                    setIsEditingUsername(true);
                                                }}
                                                className="p-1.5 bg-[#111] border border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#222] rounded-full transition-all cursor-pointer shadow-xl animate-in fade-in slide-in-from-left-2"
                                                title="Edit username"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            <p className="text-zinc-400 text-sm mt-1">
                                {user.createdAt ? `Joined on ${new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}` : 'Joined on JUL 2026'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
