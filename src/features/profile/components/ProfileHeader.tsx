/*  */'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setUser, logoutUser } from '@/store/slices/authSlice';
import { profileService } from '../api/profile.service';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { getAutoplayPreference, setAutoplayPreference, AutoplayPreference } from '@/utils/autoplaySettings';
import { extractDominantColor } from '@/utils/colorExtractor';
import { useProfileTheme } from '@/features/profile/context/ProfileThemeContext';
import { Settings, Download, Play, LogOut, X, ChevronRight, Check, MessageSquareHeart } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

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
    const [showAutoplayModal, setShowAutoplayModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentAutoplayPref, setCurrentAutoplayPref] = useState<AutoplayPreference>(() => getAutoplayPreference());
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            setIsStandalone(isApp);
        }
    }, []);

    const showInstallOption = isInstallable && !isStandalone;
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
    const [toastState, setToastState] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToastState({ message, type });
        setTimeout(() => setToastState(null), 3500);
    };

    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const { dominantColor, setDominantColor } = useProfileTheme();

    useEffect(() => {
        const coverUrl = optimisticCover || user?.coverPhoto;
        if (coverUrl) {
            extractDominantColor(coverUrl).then(color => {
                setDominantColor(color);
            });
        } else {
            setDominantColor(null);
        }
    }, [optimisticCover, user?.coverPhoto]);

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

            {/* ── Autoplay & Data Saver Settings Modal ── */}
            {showAutoplayModal && (
                <div 
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4 pb-28 sm:pb-4"
                    onClick={() => setShowAutoplayModal(false)}
                >
                    {/* Subtle Translucent Backdrop (allows blurred background to show through) */}
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] transition-opacity" />

                    {/* Modal Container */}
                    <div 
                        className="relative w-full max-w-sm sm:max-w-md z-10 animate-in zoom-in-95 fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Authentic Frosted Glass Card */}
                        <div className="relative bg-black/50 sm:bg-zinc-950/50 backdrop-blur-3xl border border-white/20 rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm shadow-[0_20px_60px_rgba(0,0,0,0.75)] overflow-hidden">
                            
                            {/* Brand Signature Fading Bottom Border Glow */}
                            <div 
                                className="absolute inset-0 z-0 pointer-events-none rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm border-[1.5px] border-transparent"
                                style={{
                                    background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.3) 40%, transparent 75%) border-box',
                                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'destination-out',
                                    maskComposite: 'exclude'
                                }}
                            />

                            {/* Specular Top Edge Highlight */}
                            <div 
                                className="absolute top-0 inset-x-0 h-[1px] pointer-events-none z-10"
                                style={{
                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)'
                                }}
                            />

                            <div className="relative z-10 p-5 sm:p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                            Trailer Autoplay & Data Saver
                                        </h2>
                                        <p className="text-xs text-white/50 mt-0.5">
                                            Control how video trailers play on title detail pages
                                        </p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowAutoplayModal(false)}
                                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Options List */}
                                <div className="flex flex-col gap-2.5 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAutoplayPreference('auto');
                                            setCurrentAutoplayPref('auto');
                                        }}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                                            currentAutoplayPref === 'auto'
                                                ? 'bg-white/[0.14] border-white/35 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] ring-1 ring-white/25 backdrop-blur-xl'
                                                : 'bg-white/[0.05] hover:bg-white/[0.10] border-white/[0.12] hover:border-white/25 text-white/75 backdrop-blur-xl'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-base flex-shrink-0 backdrop-blur-md">
                                            📱
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs sm:text-sm text-white">Smart (Recommended)</span>
                                                {currentAutoplayPref === 'auto' && (
                                                    <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30 tracking-wider uppercase backdrop-blur-md">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/55 mt-1 leading-snug">
                                                Paused on mobile devices & data saver networks. Autoplays on desktop Wi-Fi.
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAutoplayPreference('always');
                                            setCurrentAutoplayPref('always');
                                        }}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                                            currentAutoplayPref === 'always'
                                                ? 'bg-white/[0.14] border-white/35 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] ring-1 ring-white/25 backdrop-blur-xl'
                                                : 'bg-white/[0.05] hover:bg-white/[0.10] border-white/[0.12] hover:border-white/25 text-white/75 backdrop-blur-xl'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-base flex-shrink-0 backdrop-blur-md">
                                            ⚡
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs sm:text-sm text-white">Always Autoplay</span>
                                                {currentAutoplayPref === 'always' && (
                                                    <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30 tracking-wider uppercase backdrop-blur-md">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/55 mt-1 leading-snug">
                                                Always autoplays trailers on all devices after 2.5 seconds.
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAutoplayPreference('never');
                                            setCurrentAutoplayPref('never');
                                        }}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                                            currentAutoplayPref === 'never'
                                                ? 'bg-white/[0.14] border-white/35 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] ring-1 ring-white/25 backdrop-blur-xl'
                                                : 'bg-white/[0.05] hover:bg-white/[0.10] border-white/[0.12] hover:border-white/25 text-white/75 backdrop-blur-xl'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-base flex-shrink-0 backdrop-blur-md">
                                            🚫
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs sm:text-sm text-white">Never Autoplay (Data Saver)</span>
                                                {currentAutoplayPref === 'never' && (
                                                    <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-amber-400/25 text-amber-300 font-bold border border-amber-400/40 tracking-wider uppercase backdrop-blur-md">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/55 mt-1 leading-snug">
                                                Saves maximum data. Trailers will only play when you tap "Play Trailer".
                                            </p>
                                        </div>
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAutoplayModal(false)}
                                        className="cursor-pointer flex-1 px-4 py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAutoplayModal(false)}
                                        className="cursor-pointer flex-1 px-4 py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-sm font-bold bg-white hover:bg-zinc-100 text-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── In-App Feedback Modal ── */}
            <FeedbackModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                onSuccess={(msg) => showToast(msg, 'success')}
                onError={(msg) => showToast(msg, 'error')}
            />

            {/* ── iOS Control Tray Bottom Sheet (Settings & Tools) ── */}
            {isSettingsOpen && (
                <div 
                    className="fixed inset-0 z-[999] flex flex-col justify-end"
                    onClick={() => setIsSettingsOpen(false)}
                >
                    {/* Subtle Translucent Backdrop (allows blurred background to show through) */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" />

                    {/* Sheet Container */}
                    <div 
                        className="relative w-full max-w-md mx-auto z-10 animate-in slide-in-from-bottom duration-300 ease-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Authentic Frosted Glass Tray */}
                        <div className="relative bg-black/45 sm:bg-zinc-950/45 backdrop-blur-3xl border-t border-x border-white/20 rounded-t-[32px] sm:rounded-t-[36px] shadow-[0_-12px_45px_rgba(0,0,0,0.65)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] overflow-hidden">
                            
                            {/* Specular Edge Highlight */}
                            <div 
                                className="absolute top-0 inset-x-0 h-[1px] pointer-events-none"
                                style={{
                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)'
                                }}
                            />

                            {/* Drag Handle Indicator Pill */}
                            <div 
                                className="w-9 h-1 bg-white/35 rounded-full mx-auto mb-3 hover:bg-white/60 transition-colors cursor-pointer" 
                                onClick={() => setIsSettingsOpen(false)} 
                            />

                            {/* Header Row (Minimal iOS style) */}
                            <div className="flex items-center justify-between px-2 mb-4">
                                <span className="text-[11px] font-semibold tracking-wider text-white/60 uppercase">
                                    Controls & Settings
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                                    aria-label="Close tray"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Circular Tactile Control Discs (Matching Reference Image) */}
                            <div className={`grid ${showInstallOption ? 'grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3' : 'grid-cols-4 gap-2.5 sm:gap-4'} justify-items-center mb-1`}>
                                {/* 1. Import from TV Time */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        router.push('/profile/import');
                                    }}
                                    className="group flex flex-col items-center gap-1.5 cursor-pointer outline-none active:scale-95 transition-transform"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/[0.22] border border-white/[0.15] hover:border-white/30 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all">
                                        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-[#FFE144]">
                                            <path d="M4.8 4.8h14.4v4.8h-4.8v9.6H9.6V9.6H4.8Z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-zinc-300 group-hover:text-[#FFE144] uppercase transition-colors text-center leading-tight">
                                            Import
                                        </span>
                                        <span className="text-[7.5px] font-bold text-amber-400/80 uppercase mt-0.5">
                                            TV Time
                                        </span>
                                    </div>
                                </button>

                                {/* 2. Autoplay / Data Saver */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        setShowAutoplayModal(true);
                                    }}
                                    className="group flex flex-col items-center gap-1.5 cursor-pointer outline-none active:scale-95 transition-transform"
                                >
                                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.25)] border ${
                                        currentAutoplayPref === 'never'
                                            ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                                            : 'bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/[0.22] border-white/[0.15] hover:border-white/30 text-white/90'
                                    }`}>
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-zinc-300 group-hover:text-white uppercase transition-colors text-center leading-tight">
                                            Autoplay
                                        </span>
                                        <span className={`text-[7.5px] font-bold uppercase mt-0.5 ${currentAutoplayPref === 'never' ? 'text-amber-300' : 'text-zinc-500'}`}>
                                            {currentAutoplayPref === 'never' ? 'Saver On' : 'Active'}
                                        </span>
                                    </div>
                                </button>

                                {/* 3. Feedback */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        setShowFeedbackModal(true);
                                    }}
                                    className="group flex flex-col items-center gap-1.5 cursor-pointer outline-none active:scale-95 transition-transform"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/[0.22] border border-white/[0.15] hover:border-teal-400/40 text-white/85 group-hover:text-teal-300 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all">
                                        <MessageSquareHeart className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-teal-300 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-zinc-300 group-hover:text-white uppercase transition-colors text-center leading-tight">
                                            Feedback
                                        </span>
                                    </div>
                                </button>

                                {/* 3. Install App (Only shown when installable and not already running as standalone PWA) */}
                                {showInstallOption && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (isInstallable) {
                                                setIsSettingsOpen(false);
                                                await promptInstall();
                                            } else {
                                                showToast("TVTrac is already installed or your browser doesn't support install prompts.");
                                            }
                                        }}
                                        className="group flex flex-col items-center gap-1.5 cursor-pointer outline-none active:scale-95 transition-transform"
                                    >
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.25)] border bg-sky-400/15 border-sky-400/40 text-sky-300">
                                            <Download className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-zinc-300 group-hover:text-white uppercase transition-colors text-center leading-tight">
                                                Install
                                            </span>
                                            <span className="text-[7.5px] font-bold text-zinc-500 uppercase mt-0.5">
                                                Ready
                                            </span>
                                        </div>
                                    </button>
                                )}

                                {/* 4. Logout */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="group flex flex-col items-center gap-1.5 cursor-pointer outline-none active:scale-95 transition-transform"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/[0.08] hover:bg-red-500/15 active:bg-red-500/25 border border-white/[0.15] hover:border-red-500/30 text-white/80 group-hover:text-red-400 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all">
                                        <LogOut className="w-4 h-4 ml-0.5" />
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-zinc-300 group-hover:text-red-300 uppercase transition-colors text-center leading-tight">
                                        Log Out
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        <div className="w-full relative min-h-[320px] sm:min-h-[450px] md:min-h-[450px] lg:min-h-[600px] flex flex-col justify-end pb-6 md:pb-8">
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
            {toastState && (
                <div className="fixed top-14 sm:top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none max-w-[85vw]">
                    <div className="bg-zinc-950/95 backdrop-blur-xl text-zinc-100 px-3 py-1.5 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.85)] flex items-center gap-2 border border-white/10 ring-1 ring-white/5">
                        {toastState.type === 'success' ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-teal-500/25 text-teal-400 flex items-center justify-center shrink-0">
                                <Check className="w-2 h-2 stroke-[3]" />
                            </div>
                        ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500/25 text-red-400 flex items-center justify-center shrink-0">
                                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01" />
                                </svg>
                            </div>
                        )}
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wide truncate">{toastState.message}</span>
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
                <div className="absolute top-5 right-3 sm:top-4 sm:right-4 z-50 flex flex-col items-end gap-2 sm:gap-2.5">
                    {/* 1. Profile Edit (3-Dot) Button & Actions */}
                    <div className="relative flex flex-col items-end gap-2">
                        {/* 3-Dot Toggle Button */}
                        <button 
                            type="button"
                            aria-label="Profile options"
                            title={isEditMode ? "Exit Edit Mode" : "Edit Profile (Photos & Name)"}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isEditMode) {
                                    setIsEditMode(false);
                                } else {
                                    setIsCoverMenuOpen(!isCoverMenuOpen);
                                }
                            }}
                            className={`group w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm transition-all duration-200 border cursor-pointer active:scale-95 outline-none focus:outline-none focus:ring-0 backdrop-blur-md shadow-xl ${
                                isCoverMenuOpen || isEditMode 
                                    ? 'bg-zinc-850/95 border-[#2dd4bf]/70 text-white shadow-[0_0_15px_rgba(45,212,191,0.25)] ring-1 ring-[#2dd4bf]/30' 
                                    : 'bg-zinc-900/90 border-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-[#2dd4bf]/50 hover:shadow-[0_0_15px_rgba(45,212,191,0.18)]'
                            }`}
                        >
                            {isEditMode ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#2dd4bf]" />
                            ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            )}
                        </button>

                        {/* Profile Edit Dropdown (ONLY for Profile & Photos) */}
                        {isCoverMenuOpen && !isEditMode && (
                            <div className="absolute top-11 right-0 w-44 sm:w-48 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(45,212,191,0.08)] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 z-40">
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
                                    className="group w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/90 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs transition-all duration-150 cursor-pointer text-left active:scale-[0.98]"
                                >
                                    <div className="w-6 h-6 rounded-tl-md rounded-br-md rounded-tr-xs rounded-bl-xs bg-zinc-900 border border-zinc-800 group-hover:border-[#2dd4bf]/40 flex items-center justify-center text-zinc-400 group-hover:text-[#2dd4bf] transition-colors shadow-sm shrink-0">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <span>Edit Profile & Photos</span>
                                </button>
                            </div>
                        )}

                        {/* Edit Mode Action Buttons */}
                        {isEditMode && (
                            <div className="flex flex-col items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                <button 
                                    type="button"
                                    onClick={() => coverInputRef.current?.click()}
                                    disabled={isUploadingCover}
                                    className="group w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-850 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-zinc-400 hover:text-white transition-all border border-zinc-800/90 hover:border-[#2dd4bf]/50 hover:shadow-[0_0_15px_rgba(45,212,191,0.18)] active:scale-95 shadow-xl outline-none focus:outline-none focus:ring-0 backdrop-blur-md"
                                    title="Change Cover"
                                >
                                    {isUploadingCover ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-red-950/40 hover:bg-red-900/60 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-red-400 hover:text-red-300 transition-all border border-red-900/50 shadow-xl active:scale-95 outline-none focus:outline-none focus:ring-0 backdrop-blur-md"
                                        title="Delete Cover"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Settings (⚙️) Button — Placed Below the 3-Dot Option */}
                    {!isEditMode && (
                        <button 
                            type="button"
                            aria-label="Settings and tools"
                            title="Settings & Tools"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCoverMenuOpen(false);
                                setIsSettingsOpen(true);
                            }}
                            className="group w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm transition-all duration-200 border cursor-pointer active:scale-95 outline-none focus:outline-none focus:ring-0 backdrop-blur-md shadow-xl bg-zinc-900/90 border-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-[#2dd4bf]/50 hover:shadow-[0_0_15px_rgba(45,212,191,0.18)]"
                        >
                            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-white group-hover:rotate-45 transition-all duration-300" />
                        </button>
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
                        {/* Avatar */}
                        <div 
                            className="relative group/avatar shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full shadow-xl transition-all duration-700 p-0"
                            style={dominantColor ? {
                                boxShadow: `0 4px 40px -10px ${dominantColor}`
                            } : {}}
                        >
                            {/* Sketch/Hand-drawn SVG Border */}
                            <div className="absolute -inset-[12%] z-0 pointer-events-none opacity-90 transition-colors duration-700" style={{ color: dominantColor || '#52525b' }}>
                                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-[spin_20s_linear_infinite]">
                                    {/* Layer 1: Base wobbly circle */}
                                    <path d="M 100 15 C 60 10 20 40 18 95 C 15 150 45 185 100 185 C 150 185 185 145 185 95 C 185 45 145 20 100 15 Z" stroke="currentColor" strokeWidth="2.5" className="opacity-70" />
                                    {/* Layer 2: Offset messy loop */}
                                    <path d="M 95 10 C 45 15 10 60 15 110 C 20 160 65 190 105 185 C 160 180 185 140 180 90 C 175 35 135 5 95 10 Z" stroke="currentColor" strokeWidth="1.5" className="opacity-90" />
                                    {/* Layer 3: Another offset loop */}
                                    <path d="M 105 20 C 70 15 25 35 22 85 C 18 135 35 175 90 178 C 145 180 180 135 178 85 C 175 35 145 25 105 20 Z" stroke="currentColor" strokeWidth="3" className="opacity-50" />
                                    {/* Layer 4: Tight inner wobbly circle */}
                                    <path d="M 100 25 C 55 20 30 55 28 100 C 25 145 55 175 100 175 C 145 175 175 140 172 95 C 170 45 145 30 100 25 Z" stroke="currentColor" strokeWidth="1" className="opacity-80" />
                                    {/* Accent sketchy lines */}
                                    <path d="M 100 10 Q 80 5 60 15 M 15 100 Q 10 130 30 160 M 190 100 Q 195 70 170 40 M 100 190 Q 130 195 150 175" stroke="currentColor" strokeWidth="4" className="opacity-60" strokeLinecap="round"/>
                                    <path d="M 90 12 Q 110 8 130 18 M 20 90 Q 15 70 25 50 M 185 110 Q 180 140 160 160 M 70 185 Q 50 180 35 160" stroke="currentColor" strokeWidth="2" className="opacity-80" strokeLinecap="round"/>
                                </svg>
                            </div>
                            
                            {/* Inner Image Container */}
                            <div className="relative w-full h-full rounded-full bg-[#0a0a0a] overflow-hidden z-10">
                                {optimisticAvatar || user.avatar ? (
                                    <Image
                                        src={optimisticAvatar || user.avatar!}
                                        alt={user.username || user.name || 'Avatar'}
                                        fill
                                        priority
                                        sizes="(max-width: 768px) 96px, 128px"
                                        className="object-cover" 
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-500 font-bold">
                                        {(user.username || user.name).charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Particles (Sparkles) */}
                            {dominantColor && (
                                <>
                                    <svg className="absolute -top-1 -right-2 w-4 h-4 md:w-5 md:h-5 animate-pulse z-20 rotate-12" style={{ color: dominantColor, filter: `drop-shadow(0 0 5px ${dominantColor})` }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
                                    </svg>
                                    <svg className="absolute bottom-1 -left-2 w-3 h-3 md:w-4 md:h-4 animate-[pulse_3s_ease-in-out_infinite] z-20 -rotate-12" style={{ color: dominantColor, filter: `drop-shadow(0 0 3px ${dominantColor})` }} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
                                    </svg>
                                </>
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
