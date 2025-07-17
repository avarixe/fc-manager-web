import { Group, GroupProps, Indicator } from "@mantine/core";

import {
  GoalIcon,
  RedCardIcon,
  YellowCardIcon,
} from "@/components/base/CommonIcons";
import { Match } from "@/types";

export const SideSummary: React.FC<
  GroupProps & { match: Match; side: "home" | "away" }
> = ({ match, side, ...rest }) => {
  const numGoals = match[`${side}_score`];
  const numYellowCards = match.bookings.filter((booking) => {
    const isCorrectSide = booking.home === (side === "home");
    const isYellowCard = !booking.red_card;
    // Check if this player also received a red card in the same match
    const hasRedCard = match.bookings.some(
      (otherBooking) =>
        otherBooking.player_name === booking.player_name &&
        otherBooking.red_card &&
        otherBooking.home === (side === "home"),
    );
    return isCorrectSide && isYellowCard && !hasRedCard;
  }).length;
  const numRedCards = match.bookings.filter(
    (booking) => booking.home === (side === "home") && booking.red_card,
  ).length;

  return (
    <Group gap="xs" {...rest}>
      {numGoals > 0 && (
        <Indicator
          label={numGoals}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <GoalIcon />
        </Indicator>
      )}
      {numYellowCards > 0 && (
        <Indicator
          label={numYellowCards}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <YellowCardIcon />
        </Indicator>
      )}
      {numRedCards > 0 && (
        <Indicator
          label={numRedCards}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <RedCardIcon />
        </Indicator>
      )}
    </Group>
  );
};
