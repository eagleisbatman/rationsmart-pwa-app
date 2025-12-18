import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FeedRecommendation } from "@/lib/types";

interface FeedState {
  selectedFeeds: FeedRecommendation[];
  addFeed: (feed: FeedRecommendation) => void;
  removeFeed: (feedId: string) => void;
  clearFeeds: () => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set) => ({
      selectedFeeds: [],
      addFeed: (feed) =>
        set((state) => ({
          selectedFeeds: [...state.selectedFeeds, feed],
        })),
      removeFeed: (feedId) =>
        set((state) => ({
          selectedFeeds: state.selectedFeeds.filter((f) => f.feed_id !== feedId),
        })),
      clearFeeds: () => set({ selectedFeeds: [] }),
    }),
    {
      name: "feed-storage",
    }
  )
);

