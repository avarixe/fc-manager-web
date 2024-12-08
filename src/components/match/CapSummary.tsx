import { Cap } from "@/types";
import { Group, GroupProps, Indicator } from "@mantine/core";

export const CapSummary: React.FC<GroupProps & { cap: Cap }> = ({
  cap,
  ...rest
}) => {
  const {
    startMinute,
    stopMinute,
    numGoals,
    numOwnGoals,
    numAssists,
    numYellowCards,
    numRedCards,
    subbedOut,
    injured,
  } = useCapStats(cap.player_id);

  return (
    <Group gap="xs" {...rest}>
      {startMinute > 0 && (
        <Indicator
          label={`${startMinute}'`}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <SubInIcon />
        </Indicator>
      )}
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
      {numOwnGoals > 0 && (
        <Indicator
          label={numOwnGoals}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <GoalIcon c="red.9" />
        </Indicator>
      )}
      {numAssists > 0 && (
        <Indicator
          label={numAssists}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          <AssistIcon />
        </Indicator>
      )}
      {numYellowCards > 0 && <YellowCardIcon />}
      {(numRedCards > 0 || numYellowCards > 1) && <RedCardIcon />}
      {subbedOut && (
        <Indicator
          label={`${stopMinute}'`}
          color="transparent"
          inline
          position="bottom-end"
          zIndex={1}
        >
          {injured ? <MatchInjuryIcon /> : <SubOutIcon />}
        </Indicator>
      )}
    </Group>
  );
};
