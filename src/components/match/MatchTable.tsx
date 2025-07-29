import { Box, Button } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

import { teamAtom } from "@/atoms";
import { DataTable } from "@/components/base/DataTable";
import { Tables } from "@/database-generated.types";
import { MatchFilters } from "@/types";
import { formatDate } from "@/utils/format";
import { matchScore, matchScoreColor } from "@/utils/match";
import { supabase } from "@/utils/supabase";

type Match = Pick<
  Tables<"matches">,
  | "id"
  | "home_team"
  | "away_team"
  | "home_score"
  | "away_score"
  | "home_penalty_score"
  | "away_penalty_score"
  | "played_on"
  | "competition"
  | "season"
  | "stage"
>;

export const MatchTable: React.FC<{ filters?: MatchFilters }> = ({
  filters,
}) => {
  const team = useAtomValue(teamAtom)!;

  const [matches, setMatches] = useState<Match[]>([]);

  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: 10,
    rowCount: 0,
    sorting: {
      id: "played_on",
      desc: true,
    },
  });
  useEffect(() => {
    const fetchPage = async () => {
      const pageQuery = supabase
        .from("matches")
        .select(
          "id, home_team, away_team, home_score, away_score, played_on, competition, season, stage, home_penalty_score, away_penalty_score",
        )
        .range(
          tableState.pageSize * tableState.pageIndex,
          tableState.pageSize * (tableState.pageIndex + 1) - 1,
        )
        .eq("team_id", team.id);
      const countQuery = supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.id);

      if (filters) {
        if (filters.season) {
          pageQuery.eq("season", Number(filters.season));
          countQuery.eq("season", Number(filters.season));
        }
        if (filters.competition) {
          pageQuery.eq("competition", filters.competition);
          countQuery.eq("competition", filters.competition);
        }
        if (filters.team) {
          pageQuery.or(
            `home_team.ilike.%${filters.team}%, away_team.ilike.%${filters.team}%`,
          );
          countQuery.or(
            `home_team.ilike.%${filters.team}%, away_team.ilike.%${filters.team}%`,
          );
        }
        if (filters.results && filters.results.length < 3) {
          const queries: string[] = [];
          filters.results.forEach((result) => {
            switch (result) {
              case "W":
                queries.push(
                  `and(home_team.eq.${team.name},home_result.eq.W)`,
                  `and(away_team.eq.${team.name},home_result.eq.L)`,
                );
                break;
              case "D":
                queries.push(
                  `and(home_team.eq.${team.name},home_result.eq.D)`,
                  `and(away_team.eq.${team.name},home_result.eq.D)`,
                );
                break;
              case "L":
                queries.push(
                  `and(home_team.eq.${team.name},home_result.eq.L)`,
                  `and(away_team.eq.${team.name},home_result.eq.W)`,
                );
            }
          });
          pageQuery.or(queries.join(","));
          countQuery.or(queries.join(","));
        }
      }

      pageQuery.order(tableState.sorting.id, {
        ascending: !tableState.sorting.desc,
      });
      pageQuery.order("id", { ascending: !tableState.sorting.desc });

      const { data, error } = await pageQuery;
      const { count } = await countQuery;
      if (error) {
        console.error(error);
      } else {
        setMatches(data);
        setTableState((prev) => ({
          ...prev,
          rowCount: count ?? 0,
        }));
      }
    };

    fetchPage();
  }, [
    tableState.pageIndex,
    tableState.pageSize,
    tableState.sorting.id,
    tableState.sorting.desc,
    team.id,
    filters,
    team.name,
  ]);

  const columnHelper = createColumnHelper<Match>();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "teams",
        header: "Match",
        cell: ({ row }) => {
          const match = row.original;
          const color = matchScoreColor(match, team.name);
          return (
            <>
              <Button
                component={Link}
                to={`/teams/${team.id}/matches/${match.id}`}
                variant="subtle"
                size="compact-xs"
              >
                {match.home_team} v {match.away_team}
              </Button>
              <Box c={color}>{matchScore(match)}</Box>
            </>
          );
        },
        meta: { align: "center" },
      }),
      columnHelper.accessor("competition", {
        header: "Competition",
        cell: (info) => {
          const value = info.getValue();
          return (
            <>
              <div>{value}</div>
              <i>{info.row.original.stage}</i>
            </>
          );
        },
      }),
      columnHelper.accessor("played_on", {
        header: "Date Played",
        cell: (info) => {
          const value = info.getValue();
          return formatDate(value);
        },
        meta: { align: "center", sortable: true },
      }),
    ],
    [columnHelper, team.name, team.id],
  );

  return (
    <DataTable
      data={matches}
      columns={columns}
      tableState={tableState}
      setTableState={setTableState}
    />
  );
};
