'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

const STORAGE_KEY = 'tvtrac_active_import_job_id';

export interface ImportJobProgress {
  processed: number;
  total: number;
  imported: number;
  duplicates: number;
  unresolved: number;
  failed: number;
  currentStep: string;
  episodes?: {
    processed: number;
    total?: number;
    imported: number;
  };
  movies?: {
    processed: number;
    total?: number;
    imported: number;
  };
  lists?: {
    processed: number;
    total?: number;
    imported: number;
    duplicates: number;
    listsCount: number;
  };
}

export interface ImportJobData {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';
  progress: ImportJobProgress;
  failedReason?: string | null;
  result?: any;
  createdAt?: string;
  finishedOn?: string | null;
  files?: Array<{ name: string }>;
}

export function useActiveImportJob() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Step 1: Read from localStorage first (fast, synchronous)
  // Step 2: If nothing in localStorage, ask the backend if there's an active job (auto-reconnect)
  useEffect(() => {
    const syncJobId = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        setJobId(saved);
        setIsReady(true);
      }
    };

    syncJobId();

    window.addEventListener('storage', syncJobId);
    window.addEventListener('tvtrac_active_import_changed', syncJobId);

    return () => {
      window.removeEventListener('storage', syncJobId);
      window.removeEventListener('tvtrac_active_import_changed', syncJobId);
    };
  }, []);

  // Auto-reconnect: if localStorage has no jobId, ask the backend
  // This handles the case where the user dismissed the dock widget (which no longer
  // clears localStorage) or opened a new tab/device with the same session.
  useEffect(() => {
    if (!isReady) return;
    // Only attempt reconnect if localStorage has nothing
    if (jobId) return;

    let cancelled = false;
    api.get(API_ROUTES.IMPORTS.ACTIVE)
      .then((res) => {
        if (cancelled) return;
        const activeJobId: string | null = res.data?.data?.jobId ?? null;
        if (activeJobId) {
          // Reconnect: persist to localStorage so polling kicks in
          localStorage.setItem(STORAGE_KEY, activeJobId);
          setJobId(activeJobId);
        }
      })
      .catch(() => {
        // Silently ignore — no active job or auth error
      });

    return () => { cancelled = true; };
  }, [isReady]); // only runs once when hook is ready and localStorage has no jobId

  const setAndPersistJobId = useCallback((id: string | null) => {
    setJobId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      window.dispatchEvent(new Event('tvtrac_active_import_changed'));
    }
  }, []);

  // Poll job status while active/waiting
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tvtime-import-job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      try {
        const res = await api.get(API_ROUTES.IMPORTS.JOB(jobId));
        return res.data?.data as ImportJobData;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          // Stale job that expired or was removed from Redis
          setAndPersistJobId(null);
        }
        throw err;
      }
    },
    enabled: !!jobId,
    retry: 1,
    refetchInterval: (query) => {
      const jobData = query.state.data;
      if (!jobData) return 2000;
      const isRunning = jobData.state === 'active' || jobData.state === 'waiting' || jobData.state === 'delayed';
      return isRunning ? 2000 : false;
    },
    refetchOnWindowFocus: true,
  });

  const job = jobId ? (data || null) : null;
  const state = job?.state || 'idle';
  const isRunning = state === 'active' || state === 'waiting' || state === 'delayed';

  const startImportJob = async (files: File[]): Promise<string> => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f, f.name);
    }

    const res = await api.post(API_ROUTES.IMPORTS.TVTIME, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for uploading larger files
    });

    const newJobId = res.data?.jobId;
    if (!newJobId) {
      throw new Error('No jobId returned from server');
    }

    setAndPersistJobId(newJobId);
    queryClient.invalidateQueries({ queryKey: ['tvtime-import-job', newJobId] });
    return newJobId;
  };

  const cancelImportJob = async () => {
    if (!jobId) return;
    try {
      await api.post(API_ROUTES.IMPORTS.CANCEL(jobId));
      refetch();
    } catch (err) {
      console.error('Failed to request cancellation:', err);
    }
  };

  // clearActiveJob: fully removes job tracking (used after confirmed completion/cancel)
  const clearActiveJob = useCallback(() => {
    if (jobId) {
      queryClient.removeQueries({ queryKey: ['tvtime-import-job', jobId] });
    }
    queryClient.removeQueries({ queryKey: ['tvtime-import-job'] });
    setAndPersistJobId(null);
  }, [jobId, queryClient, setAndPersistJobId]);

  const fetchUnresolvedItems = async (): Promise<any[]> => {
    if (!jobId) return [];
    try {
      const res = await api.get(API_ROUTES.IMPORTS.UNRESOLVED(jobId));
      return res.data?.data || [];
    } catch (err) {
      console.error('Failed to fetch unresolved items:', err);
      return [];
    }
  };

  const resolveItem = async (unresolvedId: string, candidate: any): Promise<void> => {
    if (!jobId) return;
    await api.post(API_ROUTES.IMPORTS.RESOLVE(jobId, unresolvedId), { candidate });
  };

  return {
    jobId,
    job,
    state,
    isRunning,
    isReady,
    progress: job?.progress || {
      processed: 0,
      total: 0,
      imported: 0,
      duplicates: 0,
      unresolved: 0,
      failed: 0,
      currentStep: 'Preparing...',
    },
    isLoading,
    isError,
    startImportJob,
    cancelImportJob,
    clearActiveJob,
    fetchUnresolvedItems,
    resolveItem,
    refetch,
  };
}
