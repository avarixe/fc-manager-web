import { Box, Button } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

import { teamAtom } from "@/atoms";
import { DataTable } from "@/components/base/DataTable";
import { Match, MatchFilters } from "@/types";
import { formatDate } from "@/utils/format";
import { matchScore, matchScoreColor } from "@/utils/match";
import { supabase } from "@/utils/supabase";

type MatchItem = Pick<
  Match,
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

type ListMatchesResult = {
  count: number;
  items: MatchItem[];
};

export const MatchTable: React.FC<{ filters?: MatchFilters }> = ({
  filters,
}) => {
  const team = useAtomValue(teamAtom)!;

  const [matches, setMatches] = useState<MatchItem[]>([]);

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
      const { data, error } = await supabase.rpc("list_matches", {
        p_team_id: team.id,
        p_user_team_name: team.name,
        p_season: filters?.season ? Number(filters.season) : null,
        p_competition: filters?.competition || null,
        p_opponent: filters?.team || null,
        p_results: filters?.results ?? null,
        p_sort_desc: tableState.sorting.desc,
        p_limit: tableState.pageSize,
        p_offset: tableState.pageSize * tableState.pageIndex,
      });

      if (error) {
        console.error(error);
        return;
      }

      const result = data as unknown as ListMatchesResult | null;
      setMatches(result?.items ?? []);
      setTableState((prev) => ({
        ...prev,
        rowCount: result?.count ?? 0,
      }));
    };

    void fetchPage();
  }, [
    tableState.pageIndex,
    tableState.pageSize,
    tableState.sorting.desc,
    team.id,
    team.name,
    filters,
  ]);

  const columnHelper = createColumnHelper<MatchItem>();
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
