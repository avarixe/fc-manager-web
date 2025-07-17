import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";

import { matchAtom, supabaseAtom } from "@/atoms";
import { useMatchCallbacks } from "@/hooks/useMatchCallbacks";
import { Booking, Match } from "@/types";
import { assertType } from "@/utils/assert";

function useManageBookings() {
  const [match, setMatch] = useAtom(matchAtom);
  assertType<Match>(match);
  const supabase = useAtomValue(supabaseAtom);
  const { resolvePlayerStats } = useMatchCallbacks();

  const createBooking = useCallback(
    async (booking: Booking) => {
      const bookings = [...match.bookings, booking];
      await supabase.from("matches").update({ bookings }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, bookings } : prev));
      await resolvePlayerStats({ ...match, bookings });
    },
    [match, resolvePlayerStats, setMatch, supabase],
  );

  const updateBooking = useCallback(
    async (index: number, booking: Booking) => {
      const bookings = match.bookings.slice();
      bookings[index] = booking;

      await supabase.from("matches").update({ bookings }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, bookings } : prev));
      await resolvePlayerStats({ ...match, bookings });
    },
    [match, resolvePlayerStats, setMatch, supabase],
  );

  const removeBooking = useCallback(
    async (index: number) => {
      modals.openConfirmModal({
        title: "Delete Booking",
        centered: true,
        children: (
          <Text size="sm">
            Are you sure you want to delete this booking? This action cannot be
            undone.
          </Text>
        ),
        labels: {
          confirm: "Delete",
          cancel: "Cancel",
        },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          const bookings = match.bookings.slice();
          bookings.splice(index, 1);

          await supabase
            .from("matches")
            .update({ bookings })
            .eq("id", match.id);
          setMatch((prev) => (prev ? { ...prev, bookings } : prev));
          await resolvePlayerStats({ ...match, bookings });
        },
      });
    },
    [match, resolvePlayerStats, setMatch, supabase],
  );

  return {
    createBooking,
    updateBooking,
    removeBooking,
  };
}

export { useManageBookings };
