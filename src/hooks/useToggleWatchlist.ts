import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { profileService } from "@/features/profile/api/profile.service";
import { setUser } from "@/store/slices/authSlice";

interface ToggleWatchlistArgs {
  tmdbId: number | string;
  mediaType: 'movie' | 'tv';
  isAdded: boolean;
}

export function useToggleWatchlist() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({ tmdbId, mediaType, isAdded }: ToggleWatchlistArgs) => {
      const isShow = mediaType === 'tv';
      const updatedUser = await profileService.toggleWatchlist(
        { type: isShow ? 'shows' : 'movies', tmdbId: tmdbId.toString() } as any,
        !isAdded
      );
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      dispatch(setUser(updatedUser));
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
