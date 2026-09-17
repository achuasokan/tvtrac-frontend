'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Check,
  AlertTriangle,
  Film,
  Tv,
  ListOrdered,
  Layers,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Star,
  ShieldCheck,
  FolderArchive,
  ChevronDown,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';
import {
  parseTvTimeExportBundle,
  MultiFileParseResult,
  DetectedFile,
  TvTimeImportItem,
  TvTimeMovieImportItem,
  ImportListItemDTO,
} from '@/features/import/utils/tvTimeParser';
import { useQueryClient } from '@tanstack/react-query';

interface UnmatchedItem {
  category: 'tv' | 'movie' | 'list';
  title?: string;
  season?: number;
  episode?: number;
  reason: string;
}

interface FailedItem {
  category: 'tv' | 'movie' | 'list';
  title?: string;
  reason: string;
}

export interface UnresolvedCandidate {
  id: number | string;
  title: string;
  mediaType: 'movie' | 'tv';
  firstAirDate?: string;
  releaseDate?: string;
  year?: number;
  originalLanguage?: string;
  originCountry?: string[];
  posterPath?: string;
  voteAverage?: number;
  voteCount?: number;
  popularity?: number;
}

export interface GroupedUnresolvedItem {
  groupKey: string;
  listId?: string;
  listName?: string;
  category: 'tv' | 'movie' | 'list';
  title: string;
  mediaType?: 'movie' | 'tv';
  titleYear?: number;
  imdbId?: string;
  tvdbId?: string;
  status: 'ambiguous' | 'unmatched' | 'rejected';
  occurrences: number;
  positions?: number[];
  reason: string;
  candidates?: UnresolvedCandidate[];
  resolved?: boolean;
  resolvedCandidateTitle?: string;
}

function TvTimeLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  const borderRadius = Math.max(5, Math.round(size * 0.22));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: `${borderRadius}px`,
      }}
      className={`relative shrink-0 bg-gradient-to-b from-[#FFE34D] via-[#FFD200] to-[#F6BE00] flex items-center justify-center shadow-[0_4px_16px_rgba(255,210,0,0.35)] select-none border border-white/20 overflow-hidden group/tvtime ${className}`}
    >
      {/* Specular App Icon Gloss */}
      <div className="absolute inset-x-0 top-0 h-[44%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

      {/* Official TV Time Bold "T" Glyph */}
      <svg
        viewBox="0 0 24 24"
        className="w-[62%] h-[62%] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] relative z-10"
        fill="#141414"
      >
        <path d="M4.8 4.8h14.4v4.8h-4.8v9.6H9.6V9.6H4.8Z" />
      </svg>
    </div>
  );
}

function MilestoneMiniCard({
  icon,
  label,
  current,
  total,
  progress,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  total: number;
  progress: number;
  isActive: boolean;
}) {
  const isComplete = total > 0 && progress >= 100;
  const isSkipped = total === 0;

  return (
    <div
      className={`p-1.5 sm:p-2.5 rounded-xl border transition-all duration-300 min-w-0 ${
        isActive
          ? 'bg-white/[0.05] border-[#FFD200]/40 shadow-[0_0_12px_rgba(255,210,0,0.1)]'
          : isComplete
          ? 'bg-white/[0.025] border-emerald-500/30'
          : 'bg-white/[0.015] border-white/5 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1">
        <div className="flex items-center gap-1 min-w-0">
          <div
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center shrink-0 ${
              isActive
                ? 'bg-[#FFD200]/20 text-[#FFD200]'
                : isComplete
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-zinc-400'
            }`}
          >
            {icon}
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-white truncate">{label}</span>
        </div>

        {isSkipped ? (
          <span className="text-[7px] sm:text-[9px] font-mono text-zinc-500 shrink-0">None</span>
        ) : isComplete ? (
          <span className="flex items-center gap-0.5 text-[7px] sm:text-[9px] font-mono font-bold text-emerald-400 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Done</span>
          </span>
        ) : isActive ? (
          <span className="text-[7px] sm:text-[9px] font-mono font-bold text-[#FFD200] bg-[#FFD200]/15 px-1 py-0.2 rounded border border-[#FFD200]/30 shrink-0">
            {progress}%
          </span>
        ) : (
          <span className="text-[7px] sm:text-[9px] font-mono text-zinc-500 shrink-0">Queued</span>
        )}
      </div>

      <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-zinc-400 mb-0.5 sm:mb-1">
        <span className="font-semibold text-zinc-300 truncate">{current.toLocaleString()}</span>
        <span className="text-zinc-500 text-[7px] sm:text-[9px] truncate">/{total.toLocaleString()}</span>
      </div>

      {/* Mini Progress Track */}
      <div className="w-full h-1 rounded-full bg-zinc-950/80 border border-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
              : isActive
              ? 'bg-gradient-to-r from-[#FFE033] to-[#FFD200] shadow-[0_0_6px_rgba(255,210,0,0.6)]'
              : 'bg-zinc-700'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, isSkipped ? 0 : progress))}%` }}
        />
      </div>
    </div>
  );
}

function CircularRadialSyncWidget({
  activeProgress,
  overallProgress,
  currentStep,
  activeLabel,
  activeCurrent,
  activeTotal,
  episodes,
  movies,
  lists,
}: {
  activeProgress: number;
  overallProgress: number;
  currentStep: string;
  activeLabel: string;
  activeCurrent: number;
  activeTotal: number;
  episodes: { processed: number; total: number; progress: number; active: boolean };
  movies: { processed: number; total: number; progress: number; active: boolean };
  lists: { processed: number; total: number; progress: number; active: boolean };
}) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  const clampedProgress = Math.min(100, Math.max(0, activeProgress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  let activeShortName = 'Syncing';
  if (episodes.active) activeShortName = 'Shows';
  else if (movies.active) activeShortName = 'Movies';
  else if (lists.active) activeShortName = 'Lists';
  else if (clampedProgress >= 100) activeShortName = 'Done';

  return (
    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/15 shadow-xl space-y-3 sm:space-y-4">
      {/* Top Header Row */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#FFD200]/15 text-[#FFD200] border border-[#FFD200]/30 shrink-0">
          <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
        </div>
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block">
            {currentStep || 'Importing TV Time Data...'}
          </span>
          <span className="text-[10px] text-zinc-400 truncate block">
            Processing batches sequentially with zero duplicates
          </span>
        </div>
      </div>

      {/* Central Circular Radial Gauge Hub */}
      <div className="flex flex-col items-center justify-center py-1">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          {/* Radial SVG Gauge */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="tvTimeRadialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE566" />
                <stop offset="50%" stopColor="#FFD200" />
                <stop offset="100%" stopColor="#FF9500" />
              </linearGradient>
              <filter id="tvTimeRadialGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#FFD200" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Decorative Orbit Ring (Slow spin) */}
            <circle
              cx="80"
              cy="80"
              r="75"
              stroke="rgba(255, 210, 0, 0.16)"
              strokeWidth="1.2"
              strokeDasharray="4 5"
              fill="none"
              className="animate-[spin_25s_linear_infinite]"
            />

            {/* Background Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8"
              fill="none"
            />

            {/* Active Glowing Radial Stroke */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#tvTimeRadialGradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              filter="url(#tvTimeRadialGlow)"
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Center Stage: TV Time Icon + Percentage + Short Category Tag (Precision Optical Centering) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-1">
            <div className="drop-shadow-[0_0_6px_rgba(255,210,0,0.5)]">
              <TvTimeLogo size={18} />
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-white tracking-tight leading-none drop-shadow-md my-0.5">
              {clampedProgress}%
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#FFD200]/90 uppercase tracking-wider leading-none">
              {activeShortName}
            </span>
          </div>
        </div>

        {/* Active Category & Live Batch Counters Indicator */}
        <div className="mt-1 text-center space-y-0.5">
          <div className="text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">
            {activeLabel}
          </div>
          <div className="font-mono text-[11px] sm:text-xs text-zinc-400">
            <span className="font-extrabold text-white text-xs sm:text-sm">
              {activeCurrent.toLocaleString()}
            </span>
            <span className="text-zinc-500"> / {activeTotal.toLocaleString()} items</span>
          </div>
          {overallProgress !== activeProgress && (
            <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">
              Total Progress: <strong className="text-zinc-300">{overallProgress}%</strong>
            </p>
          )}
        </div>
      </div>

      {/* 3 Pipeline Milestone Cards - Single Row on All Devices */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-white/10">
        <MilestoneMiniCard
          icon={<Tv className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          label="Shows"
          current={episodes.processed}
          total={episodes.total}
          progress={episodes.progress}
          isActive={episodes.active}
        />

        <MilestoneMiniCard
          icon={<Film className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          label="Movies"
          current={movies.processed}
          total={movies.total}
          progress={movies.progress}
          isActive={movies.active}
        />

        <MilestoneMiniCard
          icon={<ListOrdered className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          label="Lists"
          current={lists.processed}
          total={lists.total}
          progress={lists.progress}
          isActive={lists.active}
        />
      </div>
    </div>
  );
}

export default function TvTimeImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parseResult, setParseResult] = useState<MultiFileParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showUploadedFilesDetails, setShowUploadedFilesDetails] = useState(false);

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  // Counters
  const [processedEpisodes, setProcessedEpisodes] = useState(0);
  const [importedEpisodes, setImportedEpisodes] = useState(0);

  const [processedMovies, setProcessedMovies] = useState(0);
  const [importedMovies, setImportedMovies] = useState(0);

  const [processedListItems, setProcessedListItems] = useState(0);
  const [importedListItems, setImportedListItems] = useState(0);
  const [duplicateListItems, setDuplicateListItems] = useState(0);
  const [importedListsCount, setImportedListsCount] = useState(0);

  const [unmatchedList, setUnmatchedList] = useState<UnmatchedItem[]>([]);
  const [failedList, setFailedList] = useState<FailedItem[]>([]);
  const [showUnmatchedDrawer, setShowUnmatchedDrawer] = useState(false);
  const [groupedUnresolvedList, setGroupedUnresolvedList] = useState<GroupedUnresolvedItem[]>([]);
  const [selectedGroupForResolution, setSelectedGroupForResolution] = useState<GroupedUnresolvedItem | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [unresolvedViewMode, setUnresolvedViewMode] = useState<'grouped' | 'raw'>('grouped');
  const [modalCandidates, setModalCandidates] = useState<UnresolvedCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  const handleOpenResolutionModal = (group: GroupedUnresolvedItem) => {
    setSelectedGroupForResolution(group);
    setSearchQuery(group.title || '');
    setModalCandidates(group.candidates || []);
  };

  const handleSearchTmdb = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setIsSearchingTmdb(true);
    try {
      const res = await api.get(`/tmdb/search?q=${encodeURIComponent(queryToSearch.trim())}&page=1`);
      const rawResults = res.data?.results || [];
      const mapped: UnresolvedCandidate[] = rawResults
        .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv' || r.first_air_date || r.release_date)
        .slice(0, 8)
        .map((r: any) => {
          const isTv = r.media_type === 'tv' || !!r.first_air_date;
          const dateStr = isTv ? r.first_air_date : r.release_date;
          const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : undefined;
          return {
            id: r.id,
            title: (isTv ? r.name : r.title) || r.title || r.name || 'Unknown',
            mediaType: isTv ? 'tv' : 'movie',
            firstAirDate: isTv ? r.first_air_date : undefined,
            releaseDate: !isTv ? r.release_date : undefined,
            year: isNaN(year!) ? undefined : year,
            posterPath: r.poster_path,
            voteAverage: r.vote_average,
            voteCount: r.vote_count,
          };
        });
      setModalCandidates(mapped);
    } catch (err) {
      console.error('Failed to search TMDB:', err);
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  React.useEffect(() => {
    if (!selectedGroupForResolution) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setModalCandidates(selectedGroupForResolution.candidates || []);
      return;
    }
    if (
      trimmed.toLowerCase() === selectedGroupForResolution.title.toLowerCase() &&
      (selectedGroupForResolution.candidates?.length || 0) > 0
    ) {
      setModalCandidates(selectedGroupForResolution.candidates || []);
      return;
    }

    const timer = setTimeout(() => {
      handleSearchTmdb(trimmed);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGroupForResolution]);

  const handleFiles = (files: File[]) => {
    if (!files || files.length === 0) return;
    setSelectedFiles(files);
    setIsParsing(true);
    setParseResult(null);
    setIsComplete(false);
    setUnmatchedList([]);
    setFailedList([]);
    setGroupedUnresolvedList([]);
    setSelectedGroupForResolution(null);

    // Reset counters
    setProcessedEpisodes(0);
    setImportedEpisodes(0);
    setProcessedMovies(0);
    setImportedMovies(0);
    setProcessedListItems(0);
    setImportedListItems(0);
    setDuplicateListItems(0);
    setImportedListsCount(0);

    const filePayloads: Array<{ name: string; content: string }> = [];
    let filesRead = 0;

    for (const f of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        filePayloads.push({ name: f.name, content });
        filesRead++;
        if (filesRead === files.length) {
          const bundle = parseTvTimeExportBundle(filePayloads);
          setParseResult(bundle);
          setIsParsing(false);
        }
      };
      reader.onerror = () => {
        filesRead++;
        if (filesRead === files.length) {
          const bundle = parseTvTimeExportBundle(filePayloads);
          setParseResult(bundle);
          setIsParsing(false);
        }
      };
      reader.readAsText(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setParseResult(null);
    setIsImporting(false);
    setIsComplete(false);
    setCurrentStep('');
    setProcessedEpisodes(0);
    setImportedEpisodes(0);
    setProcessedMovies(0);
    setImportedMovies(0);
    setProcessedListItems(0);
    setImportedListItems(0);
    setDuplicateListItems(0);
    setImportedListsCount(0);
    setUnmatchedList([]);
    setFailedList([]);
    setGroupedUnresolvedList([]);
    setSelectedGroupForResolution(null);
    setShowUploadedFilesDetails(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResolveCandidate = async (group: GroupedUnresolvedItem, candidate: UnresolvedCandidate) => {
    if (!group.listId) {
      alert('Cannot resolve: list ID not found');
      return;
    }
    setIsResolving(true);
    try {
      // Find all groups with the exact same title that are still unresolved
      const matchingGroups = groupedUnresolvedList.filter(
        (g) => !g.resolved && g.title.toLowerCase().trim() === group.title.toLowerCase().trim() && g.listId
      );
      const targets = matchingGroups.length > 0 ? matchingGroups : [group];

      // Add to each respective list at its exact original position
      for (const target of targets) {
        try {
          const position = target.positions && target.positions.length > 0 ? target.positions[0] : undefined;
          await api.post(`/lists/${target.listId}/items`, {
            tmdbId: String(candidate.id),
            mediaType: candidate.mediaType || target.mediaType || 'tv',
            position,
          });
        } catch (e) {
          console.warn(`Failed to add candidate to list ${target.listId}:`, e);
        }
      }

      const targetKeys = new Set(targets.map((t) => t.groupKey));

      // Update local state: mark all matching groups as resolved
      setGroupedUnresolvedList((prev) =>
        prev.map((g) =>
          targetKeys.has(g.groupKey)
            ? { ...g, resolved: true, resolvedCandidateTitle: candidate.title }
            : g
        )
      );

      // Increment imported unique list items
      setImportedListItems((prev) => prev + targets.length);

      // Invalidate queries so lists page displays the updated items
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      setSelectedGroupForResolution(null);
    } catch (err: any) {
      console.error('Failed to resolve candidate:', err);
      alert(err.response?.data?.message || err.message || 'Failed to resolve candidate');
    } finally {
      setIsResolving(false);
    }
  };

  const startImport = async () => {
    if (!parseResult || isImporting) return;

    setIsImporting(true);
    const accUnmatched: UnmatchedItem[] = [];
    const accFailed: FailedItem[] = [];
    const accGroupedMap = new Map<string, GroupedUnresolvedItem>();

    // 1. Import TV Episodes
    const epBatches = parseResult.episodes.batches;
    if (epBatches.length > 0) {
      setCurrentStep('Importing TV Shows & Episodes...');
      let epProcessed = 0;
      let epImported = 0;

      for (let b = 0; b < epBatches.length; b++) {
        const batch = epBatches[b];
        try {
          const res = await api.post(API_ROUTES.TRACKING.IMPORT_BATCH, { items: batch });
          const data = res.data;
          epProcessed += data.processed || batch.length;
          epImported += data.importedEpisodes || 0;

          if (Array.isArray(data.unmatched)) {
            data.unmatched.forEach((u: any) =>
              accUnmatched.push({
                category: 'tv',
                title: u.title || `TVDB ${u.tvdbId}`,
                season: u.season,
                episode: u.episode,
                reason: u.reason,
              })
            );
          }
          if (Array.isArray(data.failed)) {
            data.failed.forEach((f: any) =>
              accFailed.push({
                category: 'tv',
                title: f.title || `TVDB ${f.tvdbId}`,
                reason: f.reason,
              })
            );
          }

          setProcessedEpisodes(epProcessed);
          setImportedEpisodes(epImported);
          setUnmatchedList([...accUnmatched]);
          setFailedList([...accFailed]);
        } catch (err: any) {
          epProcessed += batch.length;
          setProcessedEpisodes(epProcessed);
          accFailed.push({
            category: 'tv',
            title: `Batch ${b + 1}`,
            reason: err.response?.data?.error || 'Failed to import episode batch',
          });
          setFailedList([...accFailed]);
        }
      }
    }

    // 2. Import Movies
    const movieBatches = parseResult.movies.batches;
    if (movieBatches.length > 0) {
      setCurrentStep('Importing Watched Movies...');
      let mProcessed = 0;
      let mImported = 0;

      for (let b = 0; b < movieBatches.length; b++) {
        const batch = movieBatches[b];
        try {
          const res = await api.post(API_ROUTES.TRACKING.IMPORT_MOVIES_BATCH, { items: batch });
          const data = res.data;
          mProcessed += data.processed || batch.length;
          mImported += data.importedMovies || 0;

          if (Array.isArray(data.unmatched)) {
            data.unmatched.forEach((u: any) =>
              accUnmatched.push({
                category: 'movie',
                title: u.title || u.imdbId || u.tvdbId || 'Unknown Movie',
                reason: u.reason,
              })
            );
          }
          if (Array.isArray(data.failed)) {
            data.failed.forEach((f: any) =>
              accFailed.push({
                category: 'movie',
                title: f.title || f.imdbId || f.tvdbId,
                reason: f.reason,
              })
            );
          }

          setProcessedMovies(mProcessed);
          setImportedMovies(mImported);
          setUnmatchedList([...accUnmatched]);
          setFailedList([...accFailed]);
        } catch (err: any) {
          mProcessed += batch.length;
          setProcessedMovies(mProcessed);
          accFailed.push({
            category: 'movie',
            title: `Batch ${b + 1}`,
            reason: err.response?.data?.error || 'Failed to import movie batch',
          });
          setFailedList([...accFailed]);
        }
      }
    }

    // 3. Import Lists
    const parsedLists = parseResult.lists.lists;
    if (parsedLists.length > 0) {
      setCurrentStep('Importing Custom Lists & Items...');
      let totalItemsProc = 0;
      let totalItemsImp = 0;
      let totalItemsDup = 0;
      let listsCount = 0;

      for (const listPayload of parsedLists) {
        listsCount++;
        setImportedListsCount(listsCount);

        // Process batches sequentially per list to maintain deterministic ordering
        for (const batch of listPayload.batches) {
          try {
            const res = await api.post(API_ROUTES.LISTS.IMPORT_BATCH, batch);
            const data = res.data?.data || res.data;
            totalItemsProc += data.processed || batch.items.length;
            totalItemsImp += data.importedItems || 0;
            totalItemsDup += data.duplicatesCount || 0;

            if (Array.isArray(data.unmatched)) {
              data.unmatched.forEach((u: any) =>
                accUnmatched.push({
                  category: 'list',
                  title: `${listPayload.name}: ${u.title || u.imdbId || u.tvdbId}`,
                  reason: u.reason,
                })
              );
            }
            if (Array.isArray(data.failed)) {
              data.failed.forEach((f: any) =>
                accFailed.push({
                  category: 'list',
                  title: `${listPayload.name}: ${f.title || f.imdbId || f.tvdbId}`,
                  reason: f.reason,
                })
              );
            }

            if (Array.isArray(data.unresolvedGroups)) {
              for (const g of data.unresolvedGroups) {
                const normTitle = (g.title || '').toLowerCase().trim();
                const fullKey = `${listPayload.name}:${g.mediaType || 'unknown'}:${normTitle}:${g.titleYear || ''}`;
                const existing = accGroupedMap.get(fullKey);
                if (existing) {
                  existing.occurrences += g.occurrences;
                  if ((!existing.candidates || existing.candidates.length === 0) && g.candidates) {
                    existing.candidates = g.candidates;
                  }
                  if (!existing.listId && data.listId) {
                    existing.listId = data.listId;
                  }
                  if (Array.isArray(g.positions)) {
                    if (!existing.positions) existing.positions = [];
                    for (const pos of g.positions) {
                      if (!existing.positions.includes(pos)) {
                        existing.positions.push(pos);
                      }
                    }
                    existing.positions.sort((a, b) => a - b);
                  }
                } else {
                  accGroupedMap.set(fullKey, {
                    groupKey: fullKey,
                    listId: data.listId,
                    listName: listPayload.name,
                    category: 'list',
                    title: g.title || 'Unknown Title',
                    mediaType: g.mediaType,
                    titleYear: g.titleYear,
                    imdbId: g.imdbId,
                    tvdbId: g.tvdbId,
                    status: g.status,
                    occurrences: g.occurrences,
                    positions: Array.isArray(g.positions) ? [...g.positions] : [],
                    reason: g.reason,
                    candidates: g.candidates,
                  });
                }
              }
              setGroupedUnresolvedList(Array.from(accGroupedMap.values()));
            }

            setProcessedListItems(totalItemsProc);
            setImportedListItems(totalItemsImp);
            setDuplicateListItems(totalItemsDup);
            setUnmatchedList([...accUnmatched]);
            setFailedList([...accFailed]);
          } catch (err: any) {
            totalItemsProc += batch.items.length;
            setProcessedListItems(totalItemsProc);
            accFailed.push({
              category: 'list',
              title: `${listPayload.name} batch`,
              reason: err.response?.data?.message || err.response?.data?.error || 'Failed to import list batch',
            });
            setFailedList([...accFailed]);
          }
        }
      }
    }

    setIsImporting(false);
    setIsComplete(true);
    setCurrentStep('Import Completed');

    // Invalidate queries to refresh lists and watch history
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['lists'] });
  };

  const totalEpisodesInFile = parseResult?.episodes.totalCount || 0;
  const epProgress = totalEpisodesInFile > 0 ? Math.min(100, Math.round((processedEpisodes / totalEpisodesInFile) * 100)) : 100;

  const totalMoviesInFile = parseResult?.movies.totalCount || 0;
  const movieProgress = totalMoviesInFile > 0 ? Math.min(100, Math.round((processedMovies / totalMoviesInFile) * 100)) : 100;

  const totalListItemsInFile = parseResult?.lists.totalItems || 0;
  const listProgress = totalListItemsInFile > 0 ? Math.min(100, Math.round((processedListItems / totalListItemsInFile) * 100)) : 100;

  const grandTotal = totalEpisodesInFile + totalMoviesInFile + totalListItemsInFile;
  const grandProcessed = processedEpisodes + processedMovies + processedListItems;
  const overallProgress = grandTotal > 0 ? Math.min(100, Math.round((grandProcessed / grandTotal) * 100)) : 0;

  const isEpisodesActive = currentStep.includes('TV') || currentStep.includes('Episode') || currentStep.includes('Shows');
  const isMoviesActive = currentStep.includes('Movie');
  const isListsActive = currentStep.includes('List');

  let activeProgress = overallProgress;
  let activeLabel = 'Syncing Records';
  let activeCurrent = grandProcessed;
  let activeTotal = grandTotal;

  if (isEpisodesActive && totalEpisodesInFile > 0) {
    activeProgress = epProgress;
    activeLabel = 'TV Shows & Episodes';
    activeCurrent = processedEpisodes;
    activeTotal = totalEpisodesInFile;
  } else if (isMoviesActive && totalMoviesInFile > 0) {
    activeProgress = movieProgress;
    activeLabel = 'Watched Movies';
    activeCurrent = processedMovies;
    activeTotal = totalMoviesInFile;
  } else if (isListsActive && totalListItemsInFile > 0) {
    activeProgress = listProgress;
    activeLabel = 'Custom List Items';
    activeCurrent = processedListItems;
    activeTotal = totalListItemsInFile;
  }

  const hasImportableData =
    (parseResult?.episodes.totalCount || 0) > 0 ||
    (parseResult?.movies.totalCount || 0) > 0 ||
    (parseResult?.lists.totalItems || 0) > 0;

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-[#FFD200]/30 selection:text-[#FFD200]">
      <style>{`
        @keyframes shimmerFlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmerFlow 1.6s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[420px] bg-gradient-to-b from-[#FFD200]/[0.05] via-amber-500/[0.01] to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-40 bg-[#070707]/85 backdrop-blur-xl border-b border-white/5 py-3 mb-2 sm:mb-4">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/profile"
            className="cursor-pointer px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/10 hover:border-white/20 transition-all text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Profile</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-zinc-200 border border-white/10 backdrop-blur-md">
              <TvTimeLogo size={16} />
              <span className="text-[11px] sm:text-xs">Migration Hub</span>
            </span>
          </div>
        </div>
      </div>

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl min-h-[calc(100dvh-130px)] flex flex-col justify-center py-4 sm:py-6 space-y-4 sm:space-y-5 ${
        selectedFiles.length === 0 ? 'pb-24 sm:pb-12' : 'pb-28 sm:pb-16'
      }`}>
        {/* Global File Input - Always Mounted */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFiles(files);
              e.target.value = '';
            }
          }}
          multiple
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
        />

        {/* Hero Branding Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <TvTimeLogo size={32} className="sm:w-10 sm:h-10 shrink-0" />
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-tight">Import from TV Time</h1>
              <p className="text-[11px] sm:text-sm text-zinc-400 mt-0.5 leading-snug">
                Seamlessly migrate your watch history, movie ratings, and custom collections.
              </p>
            </div>
          </div>
        </div>

        {/* 1. INITIAL STATE: Prominent Centered Dropzone */}
        {selectedFiles.length === 0 && (
          <div className="w-full">
            {/* Prominent Well-Proportioned Dropzone Card */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center transition-all duration-300 backdrop-blur-md cursor-pointer group flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] ${
                dragOver
                  ? 'border-[#FFD200] bg-[#FFD200]/5 scale-[1.01] shadow-[0_0_35px_rgba(255,210,0,0.2)]'
                  : 'border-white/15 bg-white/[0.02] hover:border-[#FFD200]/50 hover:bg-white/[0.035] shadow-xl'
              }`}
            >
              {/* Centerpiece Icon & Heading */}
              <div className="flex flex-col items-center justify-center mx-auto mb-3">
                <TvTimeLogo size={50} className="group-hover:scale-105 transition-transform duration-200" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Drag & drop your TV Time export files here
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                Select your TV Time export bundle files (<span className="text-zinc-200 font-mono text-xs">shows.json</span>, <span className="text-zinc-200 font-mono text-xs">movies.json</span>, <span className="text-zinc-200 font-mono text-xs">lists.json</span>, or list <span className="text-zinc-200 font-mono text-xs">CSV</span>s).
              </p>

              {/* Supported File Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 text-[11px] font-mono text-zinc-400">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">shows.json</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">movies.json</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">lists.json</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">*.csv</span>
              </div>

              <div className="flex items-center justify-center mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95"
                >
                  <UploadCloud className="w-4 h-4" />
                  Select Files from Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Parsing State Indicator */}
        {isParsing && (
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 text-center shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#FFD200] shadow-[0_0_20px_rgba(255,210,0,0.15)]">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Analyzing & Classifying Records</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Validating schemas, detecting movies vs series, and preparing reconciliation batches...
              </p>
            </div>
            <div className="max-w-xs mx-auto h-2 rounded-full bg-white/[0.06] border border-white/10 overflow-hidden relative">
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#FFD200] to-transparent animate-shimmer rounded-full" />
            </div>
          </div>
        )}

        {/* 2. PARSED FILES & READY DASHBOARD (Rich, Balanced & Clear) */}
        {parseResult && !isParsing && (
          <div className="space-y-5">
            {/* Detected Files Card / Accordion */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300">
              {isImporting || isComplete ? (
                /* Collapsed Accordion View during Import or after Completion */
                <div>
                  <button
                    type="button"
                    onClick={() => setShowUploadedFilesDetails((prev) => !prev)}
                    className="w-full p-2.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    aria-expanded={showUploadedFilesDetails}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight shrink-0">
                          Uploaded Files ({parseResult.detectedFiles.length})
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                          {parseResult.detectedFiles.map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 shrink-0"
                            >
                              <span className="truncate max-w-[140px] font-semibold">{f.name}</span>
                              <span className="text-zinc-500">({f.itemCount.toLocaleString()} rows)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-200 shrink-0">
                      <span className="text-[11px] font-medium hidden sm:inline">
                        {showUploadedFilesDetails ? 'Hide Files' : 'Show Files'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showUploadedFilesDetails ? 'rotate-180 text-[#FFD200]' : 'text-zinc-400'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Dropdown details: 3 Rich Stat Cards */}
                  {showUploadedFilesDetails && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-white/10 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                        {/* Shows Card */}
                        <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                          parseResult.episodes.totalCount > 0
                            ? 'bg-[#FFD200]/[0.03] border-[#FFD200]/25'
                            : 'bg-white/[0.02] border-white/5 opacity-70'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD200] shrink-0">
                              <Tv className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">TV Shows</span>
                              <p className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                                {parseResult.episodes.totalCount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">episodes</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                            {parseResult.episodes.showsCount > 0 ? `${parseResult.episodes.showsCount} unique series` : 'No show records found'}
                          </p>
                        </div>

                        {/* Movies Card */}
                        <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                          parseResult.movies.totalCount > 0
                            ? 'bg-[#FFD200]/[0.03] border-[#FFD200]/25'
                            : 'bg-white/[0.02] border-white/5 opacity-70'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD200] shrink-0">
                              <Film className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Watched Movies</span>
                              <p className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                                {parseResult.movies.totalCount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">movies</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                            {parseResult.movies.totalCount > 0 ? 'Star ratings & dates preserved' : 'No movie records found'}
                          </p>
                        </div>

                        {/* Lists Card */}
                        <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                          parseResult.lists.totalLists > 0
                            ? 'bg-[#FFD200]/[0.03] border-[#FFD200]/25'
                            : 'bg-white/[0.02] border-white/5 opacity-70'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD200] shrink-0">
                              <ListOrdered className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Custom Lists</span>
                              <p className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                                {parseResult.lists.totalLists} <span className="text-xs font-normal text-zinc-500">lists ({parseResult.lists.totalItems.toLocaleString()} items)</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                            {parseResult.lists.totalLists > 0 ? 'Order preserved · Ready to import' : 'No list records found'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Initial Parsed State: Fully expanded with Start Full Import button */
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider shrink-0">
                        Uploaded Files ({parseResult.detectedFiles.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[200px] sm:max-w-md no-scrollbar">
                        {parseResult.detectedFiles.map((f, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 shrink-0"
                          >
                            <span className="truncate max-w-[140px] font-semibold">{f.name}</span>
                            <span className="text-zinc-400">({f.itemCount.toLocaleString()} rows)</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      id="reset-import"
                      onClick={handleReset}
                      className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Change Files
                    </button>
                  </div>

                  {/* 3 Rich Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Shows Card */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      parseResult.episodes.totalCount > 0
                        ? 'bg-[#FFD200]/[0.03] border-[#FFD200]/25'
                        : 'bg-white/[0.02] border-white/5 opacity-70'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD200] shrink-0">
                          <Tv className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">TV Shows</span>
                          <p className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                            {parseResult.episodes.totalCount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">episodes</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                        {parseResult.episodes.showsCount > 0 ? `${parseResult.episodes.showsCount} unique series` : 'No show records found'}
                      </p>
                    </div>

                    {/* Movies Card */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      parseResult.movies.totalCount > 0
                        ? 'bg-[#FFD200]/[0.03] border-[#FFD200]/25'
                        : 'bg-white/[0.02] border-white/5 opacity-70'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD200] shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Watched Movies</span>
                          <p className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                            {parseResult.movies.totalCount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">movies</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                        {parseResult.movies.totalCount > 0 ? 'Star ratings & dates preserved' : 'No movie records found'}
                      </p>
                    </div>

                    {/* Lists Card */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      parseResult.lists.totalLists > 0
                        ? 'bg-[#FFD200]/[0.03] border-[#FFD200]/25'
                        : 'bg-white/[0.02] border-white/5 opacity-70'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD200] shrink-0">
                          <ListOrdered className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Custom Lists</span>
                          <p className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                            {parseResult.lists.totalLists} <span className="text-xs font-normal text-zinc-500">lists ({parseResult.lists.totalItems.toLocaleString()} items)</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                        {parseResult.lists.totalLists > 0 ? 'Order preserved · Ready to import' : 'No list records found'}
                      </p>
                    </div>
                  </div>

                  {/* Ready to Import Action Banner */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-center sm:text-left">
                      <ShieldCheck className="w-4 h-4 text-[#FFD200] shrink-0" />
                      <span className="text-xs text-zinc-300">
                        {hasImportableData
                          ? 'Ready to import safely into TVTrac.'
                          : 'No compatible importable records found in uploaded files.'}
                      </span>
                    </div>

                    {hasImportableData && (
                      <button
                        id="start-full-import"
                        onClick={startImport}
                        className="cursor-pointer shrink-0 whitespace-nowrap px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm bg-[#FFD200] hover:bg-[#ffe043] text-black text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(255,210,0,0.25)] transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Start Full Import</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. CIRCULAR RADIAL SYNC RING PROGRESS CONSOLE */}
            {isImporting && (
              <CircularRadialSyncWidget
                activeProgress={activeProgress}
                overallProgress={overallProgress}
                currentStep={currentStep}
                activeLabel={activeLabel}
                activeCurrent={activeCurrent}
                activeTotal={activeTotal}
                episodes={{
                  processed: processedEpisodes,
                  total: totalEpisodesInFile,
                  progress: epProgress,
                  active: isEpisodesActive,
                }}
                movies={{
                  processed: processedMovies,
                  total: totalMoviesInFile,
                  progress: movieProgress,
                  active: isMoviesActive,
                }}
                lists={{
                  processed: processedListItems,
                  total: totalListItemsInFile,
                  progress: listProgress,
                  active: isListsActive,
                }}
              />
            )}

            {/* 4. COMPLETE STATE DASHBOARD */}
            {isComplete && (
              <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/15 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight">Import Complete!</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">All supported records have been migrated and reconciled safely.</p>
                  </div>
                </div>

                {/* 3 Stats Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Episodes Ingested</span>
                    <p className="text-lg sm:text-xl font-extrabold text-white font-mono mt-0.5">{importedEpisodes.toLocaleString()}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Movies Ingested</span>
                    <p className="text-lg sm:text-xl font-extrabold text-white font-mono mt-0.5">{importedMovies.toLocaleString()}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Lists / Items</span>
                    <p className="text-lg sm:text-xl font-extrabold text-white font-mono mt-0.5">
                      {importedListsCount} <span className="text-xs text-zinc-400 font-normal">({importedListItems.toLocaleString()} items)</span>
                    </p>
                  </div>
                </div>

                {/* Custom Lists Accounting Breakdown */}
                {totalListItemsInFile > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <ListOrdered className="w-3.5 h-3.5 text-[#FFD200]" />
                      Lists Breakdown:
                    </span>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {importedListItems.toLocaleString()} unique items
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10">
                        {duplicateListItems.toLocaleString()} duplicates collapsed
                      </span>
                      {unmatchedList.filter((u) => u.category === 'list').length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {unmatchedList.filter((u) => u.category === 'list').length} unmatched titles
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Unmatched Titles Resolution Drawer */}
                {(unmatchedList.length > 0 || failedList.length > 0) && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-zinc-300 font-medium">
                        {groupedUnresolvedList.length > 0
                          ? `${groupedUnresolvedList.length} ${groupedUnresolvedList.length === 1 ? 'title needs' : 'titles need'} matching (${unmatchedList.length} ${unmatchedList.length === 1 ? 'item' : 'items'}).`
                          : `${unmatchedList.length} items could not be matched automatically.`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowUnmatchedDrawer(!showUnmatchedDrawer)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        {showUnmatchedDrawer ? 'Hide Unmatched' : 'Review & Match Titles'}
                      </button>
                    </div>

                    {showUnmatchedDrawer && (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {unresolvedViewMode === 'grouped' ? (
                          groupedUnresolvedList.length > 0 ? (
                            groupedUnresolvedList.map((group) => (
                              <div
                                key={group.groupKey}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-white/20 transition-all"
                              >
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-white text-xs truncate">{group.title}</span>
                                    {group.titleYear && (
                                      <span className="text-zinc-500 font-mono text-[11px]">({group.titleYear})</span>
                                    )}
                                    {group.listName && (
                                      <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/25 max-w-[150px]" title={`From list: ${group.listName}`}>
                                        <ListOrdered className="w-2.5 h-2.5 shrink-0 text-[#FFD200]" />
                                        <span className="truncate">{group.listName}</span>
                                      </span>
                                    )}
                                    <span className="shrink-0 whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-zinc-300 border border-white/10">
                                      {group.occurrences} {group.occurrences === 1 ? 'row' : 'rows'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-tight truncate">{group.reason}</p>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {group.resolved ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                                      <Check className="w-3 h-3" />
                                      Matched
                                    </span>
                                  ) : group.candidates && group.candidates.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenResolutionModal(group)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD200] text-black font-bold text-xs hover:bg-[#ffe043] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Match ({group.candidates.length})
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenResolutionModal(group)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold text-xs transition-all cursor-pointer border border-white/10 hover:border-white/20"
                                    >
                                      <Search className="w-3 h-3 text-[#FFD200]" />
                                      Find Match
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-zinc-500 text-xs bg-white/[0.02] rounded-xl">
                              No grouped records available.
                            </div>
                          )
                        ) : (
                          unmatchedList.map((item, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-start justify-between gap-1 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-zinc-200 text-xs">
                                  [{item.category.toUpperCase()}] {item.title}
                                </span>
                                <p className="text-[10px] text-zinc-500">{item.reason}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Final Navigation Actions */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-xs sm:text-sm font-bold bg-[#FFD200] hover:bg-[#ffe043] text-black shadow-[0_0_15px_rgba(255,210,0,0.25)] transition-all active:scale-95 whitespace-nowrap"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Another File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Resolution Modal */}
      {selectedGroupForResolution && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="shrink-0 mt-0.5">
                    <TvTimeLogo size={28} className="rounded-md" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight break-words">
                        Match "{selectedGroupForResolution.title}"
                      </h3>
                      {selectedGroupForResolution.titleYear && (
                        <span className="text-zinc-500 font-mono text-xs mt-0.5 inline-block">
                          Release Year: {selectedGroupForResolution.titleYear}
                        </span>
                      )}
                    </div>

                    {/* Meta Badges Row - Clean single-line pills with zero vertical wrapping */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="shrink-0 whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-zinc-200 border border-white/15">
                        {selectedGroupForResolution.occurrences} {selectedGroupForResolution.occurrences === 1 ? 'entry' : 'entries'}
                      </span>
                      {selectedGroupForResolution.listName && (
                        <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFD200]/10 text-[#FFD200] border border-[#FFD200]/25">
                          <ListOrdered className="w-3.5 h-3.5 shrink-0 text-[#FFD200]" />
                          <span>List: {selectedGroupForResolution.listName}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed pt-0.5">
                      Choose the correct movie or show to link with your TV Time watch history.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGroupForResolution(null)}
                  className="p-1.5 -mr-1 -mt-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Search Input Bar - Exact design from List page SearchAndAddModal */}
            <div className="p-4 border-b border-white/5 shrink-0 bg-white/[0.01]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) handleSearchTmdb(searchQuery.trim());
                }}
                className="relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies or TV shows..."
                  className="w-full pl-11 pr-10 py-3 bg-black/50 border border-white/10 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD200]/70 focus:shadow-[0_0_20px_rgba(255,210,0,0.25)] transition-all"
                />

                {isSearchingTmdb ? (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FFD200]">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setModalCandidates(selectedGroupForResolution?.candidates || []);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </form>
            </div>

            {/* Candidates List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {isSearchingTmdb ? (
                <div className="p-8 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#FFD200]" />
                  <span>Searching TMDB for "{searchQuery}"...</span>
                </div>
              ) : modalCandidates && modalCandidates.length > 0 ? (
                modalCandidates.map((cand) => (
                  <div
                    key={String(cand.id)}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5 hover:border-white/20 hover:bg-white/[0.05] transition-all group"
                  >
                    {/* Poster thumbnail */}
                    {cand.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${cand.posterPath}`}
                        alt={cand.title}
                        className="w-14 h-20 object-cover rounded-lg bg-zinc-800 shrink-0 border border-white/10 shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 shrink-0">
                        <Film className="w-5 h-5" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-[#FFD200] transition-colors truncate">
                            {cand.title}
                          </h4>
                          <span className="text-xs text-zinc-400 font-mono">
                            {cand.year || cand.firstAirDate?.slice(0, 4) || cand.releaseDate?.slice(0, 4) || 'Unknown year'}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-white/5 text-zinc-300 border border-white/10 shrink-0">
                          {cand.mediaType}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                        {cand.voteCount !== undefined && cand.voteCount > 0 && (
                          <span className="flex items-center gap-1 text-zinc-300 font-medium">
                            <Star className="w-3 h-3 fill-[#FFD200] text-[#FFD200]" />
                            {cand.voteAverage?.toFixed(1)} ({cand.voteCount})
                          </span>
                        )}

                        <span className="text-zinc-500 font-mono text-[10px]">
                          TMDB: {cand.id}
                        </span>
                      </div>

                      <div className="pt-1.5 flex justify-end">
                        <button
                          type="button"
                          disabled={isResolving}
                          onClick={() => handleResolveCandidate(selectedGroupForResolution, cand)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#FFD200] hover:bg-[#ffe043] text-black text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {isResolving ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              Select
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-400 text-xs space-y-1">
                  <p className="font-semibold text-white">No matches found for "{searchQuery}"</p>
                  <p className="text-zinc-500 text-[11px]">Try adjusting the spelling or typing the release year in the search bar above.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-zinc-400">
              <span>Selection saves automatically to your library.</span>
              <button
                type="button"
                onClick={() => setSelectedGroupForResolution(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-200 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
