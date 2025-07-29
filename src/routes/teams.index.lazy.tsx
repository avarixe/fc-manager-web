import { Button, Group, Stack, Title } from "@mantine/core";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { breadcrumbsAtom } from "@/atoms";
import { LocalDataTable } from "@/components/base/LocalDataTable";
import { Tables } from "@/database-generated.types";
import { formatDate } from "@/utils/format";
import { supabase } from "@/utils/supabase";

export const Route = createLazyFileRoute("/teams/")({
  component: TeamsPage,
});

const columnHelper = createColumnHelper<Tables<"teams">>();
const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => {
      const value = info.getValue();
      return (
        <Button
          component={Link}
          to={`/teams/${info.row.original.id}`}
          variant="subtle"
          size="xs"
        >
          {value}
        </Button>
      );
    },
    meta: { sortable: true },
  }),
  columnHelper.accessor("started_on", {
    header: "Start Date",
    cell: (info) => {
      const value = info.getValue();
      return formatDate(value);
    },
    meta: { align: "center", sortable: true },
  }),
  columnHelper.accessor("currently_on", {
    header: "Current Date",
    cell: (info) => {
      const value = info.getValue();
      return formatDate(value);
    },
    meta: { align: "center", sortable: true },
  }),
  columnHelper.accessor("manager_name", {
    header: "Manager Name",
    meta: { align: "center", sortable: true },
  }),
  columnHelper.accessor("game", {
    header: "Game",
    meta: { align: "center", sortable: true },
  }),
];

function TeamsPage() {
  const [teams, setTeams] = useState<Tables<"teams">[]>([]);
  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from("teams").select();
      if (data) {
        setTeams(data);
      }
    };

    fetchTeams();
  }, []);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
    ]);
  }, [setBreadcrumbs]);

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Teams
      </Title>

      <Group>
        <Button component={Link} to="/teams/new">
          New Team
        </Button>
        <Button component={Link} to="/teams/import" variant="outline">
          Import Team
        </Button>
      </Group>

      <LocalDataTable data={teams} columns={columns} sortBy="started_on" />
    </Stack>
  );
}
