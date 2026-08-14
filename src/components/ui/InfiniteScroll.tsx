'use client';

import React, { useRef, useCallback } from 'react';
import { IconLoader } from "./IconLoader";

interface InfiniteScrollProps {
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    children?: React.ReactNode;
}

export function InfiniteScroll({ hasMore, isLoading, onLoadMore, children }: InfiniteScrollProps) {
    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || !hasMore) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                onLoadMore();
            }
        });
        
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, onLoadMore]);

    return (
        <>
            {children}
            {hasMore && (
                <div ref={lastElementRef} className="flex justify-center py-10 mt-8 min-h-[100px]">
                    {isLoading && (
                        <IconLoader size={32} />
                    )}
                </div>
            )}
        </>
    );
}
