import { round } from "lodash-es";

import { statGradientColors } from "@/constants";
import { Player } from "@/types";

export function playerRecordAt(
  player: Pick<Player, "history">,
  date: string,
): { ovr: number; value: number } | undefined {
  const historyDates = Object.keys(player.history).sort().reverse();
  const recordDate = historyDates.find((d) => d <= date);
  return recordDate ? player.history[recordDate] : undefined;
}

export function playerOvrAt(
  player: Pick<Player, "history">,
  date: string,
): number | undefined {
  return playerRecordAt(player, date)?.ovr;
}

export function playerValueAt(
  player: Pick<Player, "history">,
  date: string,
): number | undefined {
  return playerRecordAt(player, date)?.value;
}

const ovrThresholds = [90, 85, 80, 75, 70, 65, 60, 55, 50];
const playerValueThresholds = [
  150_000_000, 50_000_000, 25_000_000, 10_000_000, 5_000_000, 1_000_000,
  700_000, 300_000, 100_000,
];

export function ovrColor(ovr: number) {
  const index = ovrThresholds.findIndex((threshold) => ovr >= threshold);
  return statGradientColors[index ?? 9];
}

export function playerValueColor(value: number) {
  const index = playerValueThresholds.findIndex(
    (threshold) => value >= threshold,
  );
  return statGradientColors[index ?? 9];
}

export function abbrevValue(value?: number, prefix = "") {
  if (value === undefined) {
    return value;
  }

  const absValue = Math.abs(value);
  const signedPrefix = `${value < 0 ? "-" : ""}${prefix}`;
  if (absValue >= 1_000_000) {
    return `${signedPrefix}${round(absValue / 1_000_000, 1)}M`;
  } else if (absValue >= 1_000) {
    return `${signedPrefix}${round(absValue / 1_000, 1)}K`;
  } else {
    return `${signedPrefix}${absValue}`;
  }
}
