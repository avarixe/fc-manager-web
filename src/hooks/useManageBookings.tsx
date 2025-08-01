import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useAtom } from "jotai";
import { useCallback } from "react";

import { matchAtom } from "@/atoms";
import { useMatchCallbacks } from "@/hooks/useMatchCallbacks";
import { Booking } from "@/types";
import { assertDefined } from "@/utils/assert";
import { supabase } from "@/utils/supabase";

function useManageBookings() {
  const [match, setMatch] = useAtom(matchAtom);
  assertDefined(match);

  const { resolvePlayerStats } = useMatchCallbacks();

  const createBooking = useCallback(
    async (booking: Booking) => {
      const bookings = [...match.bookings, booking];
      await supabase.from("matches").update({ bookings }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, bookings } : prev));
      await resolvePlayerStats({ ...match, bookings });
    },
    [match, resolvePlayerStats, setMatch],
  );

  const updateBooking = useCallback(
    async (index: number, booking: Booking) => {
      const bookings = match.bookings.slice();
      bookings[index] = booking;

      await supabase.from("matches").update({ bookings }).eq("id", match.id);
      setMatch((prev) => (prev ? { ...prev, bookings } : prev));
      await resolvePlayerStats({ ...match, bookings });
    },
    [match, resolvePlayerStats, setMatch],
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
    [match, resolvePlayerStats, setMatch],
  );

  return {
    createBooking,
    updateBooking,
    removeBooking,
  };
}

export { useManageBookings };
