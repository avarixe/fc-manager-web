import { Player } from "@/types";

export function playerOvrAt(
  player: Pick<Player, "history">,
  date: string,
): number | null {
  const historyDates = Object.keys(player.history).sort().reverse();
  const recordDate = historyDates.find((d) => d <= date);
  return recordDate ? player.history[recordDate].ovr : null;
}

export function playerValueAt(
  player: Pick<Player, "history">,
  date: string,
): number | null {
  const historyDates = Object.keys(player.history).sort().reverse();
  const recordDate = historyDates.find((d) => d <= date);
  return recordDate ? player.history[recordDate].value : null;
}
