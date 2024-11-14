import { Box, Group, Title } from "@mantine/core";

interface OvrData {
  type: MatchPosType;
  value: number;
  weight: number;
}

const baseStat = {
  total: 0,
  weight: 0,
  average: 0,
};

export const FormationOvr: React.FC<{
  data: OvrData[];
}> = ({ data }) => {
  const formationOvr = useMemo(() => {
    return data.reduce(
      (ovrs, item) => {
        if (item) {
          ovrs[item.type].total += item.value * item.weight;
          ovrs[item.type].weight += item.weight;
          ovrs[item.type].average = Math.round(
            ovrs[item.type].total / ovrs[item.type].weight,
          );
        }
        return ovrs;
      },
      {
        DEF: { ...baseStat },
        MID: { ...baseStat },
        FWD: { ...baseStat },
      },
    );
  }, [data]);

  return (
    <Group grow>
      {[MatchPosType.DEF, MatchPosType.MID, MatchPosType.FWD].map((type) => (
        <Box ta="center" key={type}>
          <Title c={ovrColor(formationOvr[type].average)}>
            {formationOvr[type].average}
          </Title>
          <Title order={6}>{type}</Title>
        </Box>
      ))}
    </Group>
  );
};
