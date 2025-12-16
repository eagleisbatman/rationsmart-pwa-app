import { create } from "zustand";
import { CattleInfo } from "@/lib/types";

interface CattleInfoState {
  cattleInfo: Partial<CattleInfo>;
  setCattleInfo: (info: Partial<CattleInfo>) => void;
  reset: () => void;
}

const defaultCattleInfo: Partial<CattleInfo> = {
  breed: "",
  bc_score: 0,
  body_weight: 0,
  calving_interval: 0,
  bw_gain: 0,
  days_in_milk: 0,
  days_of_pregnancy: 0,
  distance: 0,
  grazing: false,
  lactating: false,
  fat_milk: 0,
  milk_production: 0,
  tp_milk: 0,
  parity: 0,
  temperature: 0,
  topography: "",
};

export const useCattleInfoStore = create<CattleInfoState>((set) => ({
  cattleInfo: defaultCattleInfo,
  setCattleInfo: (info) =>
    set((state) => ({ cattleInfo: { ...state.cattleInfo, ...info } })),
  reset: () => set({ cattleInfo: defaultCattleInfo }),
}));

