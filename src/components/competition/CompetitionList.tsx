import { Tables } from "@/database-generated.types";
import { Competition } from "@/types";
import { BoxProps, Button, NavLink } from "@mantine/core";

type CompetitionItem = Pick<Tables<"competitions">, "id" | "name" | "champion">;

export const CompetitionList: React.FC<{
  competitions: CompetitionItem[];
  season: number;
  team: Tables<"teams">;
}> = ({ competitions, season, team }) => {
  const { seasonLabel } = useTeamHelpers(team);

  return (
    <>
      <Button
        component={Link}
        to={`/teams/${team.id}/seasons/${season}`}
        variant="subtle"
        size="compact-xl"
      >
        {seasonLabel(season)}
      </Button>
      {competitions.map((competition) => (
        <NavLink
          key={competition.id}
          component={Link}
          to={`/teams/${team.id}/competitions/${competition.id}`}
          label={competition.name}
          description={competition.champion}
          leftSection={<CompetitionStatusIcon competition={competition} />}
        />
      ))}
    </>
  );
};

export const CompetitionStatusIcon: React.FC<
  BoxProps & {
    competition: Pick<Competition, "champion">;
  }
> = ({ competition, ...rest }) => {
  const team = useAtomValue(teamAtom)!;
  if (competition.champion) {
    return competition.champion === team.name ? (
      <BaseIcon name="i-mdi:trophy" c="yellow" {...rest} />
    ) : (
      <BaseIcon name="i-mdi:trophy-broken" c="red.6" {...rest} />
    );
  } else {
    return <BaseIcon name="i-mdi:timelapse" {...rest} />;
  }
};
