export type EmotionType = 'mindblown' | 'loved' | 'funny' | 'epic' | 'tense' | 'shocked' | 'emotional' | 'confused' | 'angry' | 'boring';

export interface MvpCharacter {
  characterId: number;
  name: string;
  actorName: string;
  profilePath: string | null;
  voteCount: number;
  percentage: number;
}

export interface EpisodeSummary {
  emotionStats: {
    mindblown: number;
    loved: number;
    funny: number;
    epic: number;
    tense: number;
    shocked: number;
    emotional: number;
    confused: number;
    angry: number;
    boring: number;
    total: number;
  };
  ratingStats: {
    averageRating: number | null;
    totalRatings: number;
  };
  mvpLeaderboard: MvpCharacter[];
  totalComments: number;
  userReaction: {
    emotion?: EmotionType | null;
    characterId?: number | null;
    rating?: number | null;
    platform?: string | null;
  } | null;
  isWatchedByMe: boolean;
}

export interface MovieSummary {
  ratingStats: {
    averageRating: number | null;
    totalRatings: number;
  };
  mvpLeaderboard: MvpCharacter[];
  totalComments: number;
  userReaction: {
    characterId?: number | null;
    rating?: number | null;
    platform?: string | null;
  } | null;
  isWatchedByMe: boolean;
}

export interface CommentMedia {
  type: 'image' | 'gif';
  url: string;
}

export interface DiscussionComment {
  _id: string;
  user: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    profileImage?: string;
  };
  content: string | null;
  media?: CommentMedia | null;
  isSpoiler: boolean;
  isMediaMasked?: boolean;
  likeCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  content?: string;
  isSpoiler?: boolean;
  mediaId?: string;
}

export interface PendingMediaAttachment {
  mediaId: string;
  previewUrl: string;
  type: 'image' | 'gif';
}

export interface CommentsResponse {
  comments: DiscussionComment[];
  nextCursor: string | null;
  hasMore: boolean;
  isWatchedByMe: boolean;
}

export interface CastMember {
  id: number;
  name: string; // Character name
  actorName: string;
  profilePath: string | null;
}
