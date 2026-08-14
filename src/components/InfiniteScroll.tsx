"use client";

import React, { useEffect, useRef } from 'react';
import { IconLoader } from "@/components/ui/IconLoader";

interface InfiniteScrollProps {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading }: InfiniteScrollProps) {
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { threshold: 0.5 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, hasMore, isLoading, onLoadMore]);

    if (!hasMore) return null;

    return (
        <div ref={observerTarget} className="w-full flex justify-center py-8">
            {isLoading && (
                <IconLoader size={32} />
            )}
        </div>
    );
}
