import { Tables } from "@/database-generated.types";
import { NavLink } from "@mantine/core";

type CompetitionItem = Pick<Tables<"competitions">, "id" | "name" | "champion">;

export const CompetitionList: React.FC<{
  competitions: CompetitionItem[];
  team: Tables<"teams">;
}> = ({ competitions, team }) => {
  const statusIcon = useCallback(
    (competition: CompetitionItem) => {
      if (competition.champion) {
        return competition.champion === team.name
          ? "i-mdi:trophy text-yellow"
          : "i-mdi:trophy-broken text-red";
      } else {
        return "i-mdi:timelapse";
      }
    },
    [team.name],
  );

  return (
    <>
      {competitions.map((competition) => (
        <NavLink
          key={competition.id}
          component={Link}
          to={`/teams/${team.id}/competitions/${competition.id}`}
          label={competition.name}
          description={competition.champion}
          leftSection={<div className={statusIcon(competition)} />}
        />
      ))}
    </>
  );
};
