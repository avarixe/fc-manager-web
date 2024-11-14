import { Player } from "@/types";
import { round } from "lodash-es";

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

export function ovrColor(ovr: number) {
  if (ovr >= 90) {
    return "green.8";
  } else if (ovr >= 85) {
    return "green.6";
  } else if (ovr >= 80) {
    return "green";
  } else if (ovr >= 75) {
    return "lime.2";
  } else if (ovr >= 70) {
    return "yellow";
  } else if (ovr >= 65) {
    return "orange.2";
  } else if (ovr >= 60) {
    return "orange";
  } else if (ovr >= 55) {
    return "orange.6";
  } else if (ovr >= 50) {
    return "red";
  } else {
    return "red.6";
  }
}

export function playerValueColor(value: number) {
  if (value >= 150_000_000) {
    return "green.8";
  } else if (value >= 100_000_000) {
    return "green.6";
  } else if (value >= 50_000_000) {
    return "green";
  } else if (value >= 25_000_000) {
    return "lime.2";
  } else if (value >= 10_000_000) {
    return "yellow";
  } else if (value >= 5_000_000) {
    return "orange.2";
  } else if (value >= 1_000_000) {
    return "orange";
  } else if (value >= 700_000) {
    return "orange.6";
  } else if (value >= 300_000) {
    return "red";
  } else {
    return "red.6";
  }
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
