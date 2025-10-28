import { BisListJson, BisItem } from "../types/wow";
import bisListRawJson from "../../bis_list_with_ids.json";
import { SLOT_LABELS } from "../constants";

const bisListRaw = bisListRawJson as BisListJson;

export const getBisListForSpec = (
  className?: string,
  spec?: string
): BisItem[] => {
  if (!bisListRaw) return [];
  if (!className || !spec) return [];
  const safeClass = className.trim();
  const safeSpec = spec.trim();
  if (!safeClass || !safeSpec) return [];
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const key = `${cap(safeSpec)} ${cap(safeClass)}`;
  return bisListRaw[key] || [];
};

export const isRingSlot = (idx: number) =>
  SLOT_LABELS[idx]?.toLowerCase().includes("finger");
export const isTrinketSlot = (idx: number) =>
  SLOT_LABELS[idx]?.toLowerCase().includes("trinket");

export interface BisEvaluationResult {
  bis: boolean;
  bisItem: BisItem | undefined;
  bisInfoId: number | undefined;
  missingBisId?: number;
  missingBisName?: string;
  missingBisSource?: string;
}

// Evaluate ring/trinket logic generically
export const evaluateBisForSlot = (
  idx: number,
  itemId: number,
  characterItems: { id: number }[],
  bisList: BisItem[]
): BisEvaluationResult => {
  let bisItem = bisList[idx];
  let bisId = bisItem?.id;
  let bis = false;
  let missingBisId: number | undefined;
  let missingBisName: string | undefined;
  let missingBisSource: string | undefined;

  if (isRingSlot(idx)) {
    const ringBisItems = bisList.filter((b) =>
      b.slot.toLowerCase().includes("ring")
    );
    const ringBisIds = ringBisItems.map((b) => b.id);
    const equippedRingIds = [characterItems[10]?.id, characterItems[11]?.id];
    bis = ringBisIds.includes(itemId);
    bisId = bis ? itemId : ringBisIds[idx - 10] || ringBisIds[0];
    bisItem =
      ringBisItems.find((b) => b.id === bisId) ||
      ringBisItems[idx - 10] ||
      ringBisItems[0];
    if (!bis) {
      const missingBisIds = ringBisIds.filter(
        (id) => !equippedRingIds.includes(id)
      );
      if (missingBisIds.length > 0) {
        const missingIdx = idx - 10;
        const missingBisIdForSlot =
          missingBisIds[missingIdx] || missingBisIds[0];
        const missingBisForSlot = ringBisItems.find(
          (b) => b.id === missingBisIdForSlot
        );
        if (missingBisForSlot) {
          missingBisId = missingBisForSlot.id;
          missingBisName = missingBisForSlot.item;
          missingBisSource = missingBisForSlot.source;
        }
      }
    }
  } else if (isTrinketSlot(idx)) {
    const trinketBisItems = bisList.filter((b) =>
      b.slot.toLowerCase().includes("trinket")
    );
    const trinketBisIds = trinketBisItems.map((b) => b.id);
    const equippedTrinketIds = [characterItems[12]?.id, characterItems[13]?.id];
    bis = trinketBisIds.includes(itemId);
    bisId = bis ? itemId : trinketBisIds[idx - 12] || trinketBisIds[0];
    bisItem =
      trinketBisItems.find((b) => b.id === bisId) ||
      trinketBisItems[idx - 12] ||
      trinketBisItems[0];
    if (!bis) {
      const missingBisIds = trinketBisIds.filter(
        (id) => !equippedTrinketIds.includes(id)
      );
      if (missingBisIds.length > 0) {
        const missingIdx = idx - 12;
        const missingBisIdForSlot =
          missingBisIds[missingIdx] || missingBisIds[0];
        const missingBisForSlot = trinketBisItems.find(
          (b) => b.id === missingBisIdForSlot
        );
        if (missingBisForSlot) {
          missingBisId = missingBisForSlot.id;
          missingBisName = missingBisForSlot.item;
          missingBisSource = missingBisForSlot.source;
        }
      }
    }
  } else {
    bis = itemId === bisId;
  }

  return {
    bis,
    bisItem,
    bisInfoId: bisId,
    missingBisId,
    missingBisName,
    missingBisSource,
  };
};
