import {
  AppShell,
  Avatar,
  ComboboxItem,
  Group,
  Loader,
  NavLink,
  ScrollArea,
  Select,
  Stack,
  Button,
} from "@mantine/core";

export const AppNavbar = () => {
  const team = useAtomValue(teamAtom);
  const { currentSeason } = useTeamHelpers(team);
  const supabase = useAtomValue(supabaseAtom);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsLoggingOut(false);
    }
  }, [supabase]);

  return (
    <AppShell.Navbar p="md">
      <Stack h="100%" justify="space-between">
        <ScrollArea type="scroll" flex={1}>
          <NavLink
            component={Link}
            label="Home"
            to="/"
            leftSection={<div className="i-mdi:home" />}
          />
          <NavLink
            component={Link}
            label="Teams"
            to="/teams"
            activeOptions={{ exact: true }}
            leftSection={<div className="i-mdi:shield-half-full" />}
          />

          {team && (
            <NavLink
              label={team.name}
              leftSection={
                <Avatar src={team.badge_path}>
                  <BaseIcon name="i-mdi:shield-half-full" fz={20} />
                </Avatar>
              }
              mt="md"
              defaultOpened
            >
              <TeamDatePicker team={team} />
              <NavLink
                component={Link}
                to={`/teams/${team.id}`}
                activeOptions={{ exact: true }}
                label="Dashboard"
                leftSection={<div className="i-mdi:view-dashboard" />}
              />
              <NavLink
                label="Players"
                leftSection={<div className="i-mdi:run" />}
              >
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/players`}
                  label="List"
                  leftSection={<BaseIcon name="i-mdi:view-list" />}
                  activeOptions={{ exact: true }}
                />
                <NavLink
                  label={<PlayerSearch />}
                  leftSection={<BaseIcon name="i-mdi:search" />}
                />
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/players/new`}
                  label="New"
                  leftSection={<BaseIcon name="i-mdi:plus-circle-outline" />}
                />
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/players/development`}
                  label="Development"
                  leftSection={<BaseIcon name="i-mdi:trending-up" />}
                />
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/players/statistics`}
                  label="Statistics"
                  leftSection={<BaseIcon name="i-mdi:hashtag" />}
                />
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/players/analytics`}
                  label="Analytics"
                  leftSection={<BaseIcon name="i-mdi:google-analytics" />}
                />
              </NavLink>
              <NavLink
                label="Matches"
                leftSection={<div className="i-mdi:soccer-field" />}
              >
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/matches`}
                  label="List"
                  leftSection={<BaseIcon name="i-mdi:view-list" />}
                  activeOptions={{ exact: true }}
                />
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/matches/new`}
                  label="New"
                  leftSection={<BaseIcon name="i-mdi:plus-circle-outline" />}
                />
              </NavLink>
              <NavLink
                label="Competitions"
                leftSection={<div className="i-mdi:trophy" />}
              >
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/competitions`}
                  label="List"
                  leftSection={<BaseIcon name="i-mdi:view-list" />}
                  activeOptions={{ exact: true }}
                />
                <NavLink
                  component={Link}
                  to={`/teams/${team.id}/competitions/new`}
                  label="New"
                  leftSection={<BaseIcon name="i-mdi:plus-circle-outline" />}
                />
              </NavLink>
              <NavLink
                component={Link}
                to={`/teams/${team.id}/seasons/${currentSeason}`}
                label="Current Season"
                leftSection={<div className="i-mdi:calendar-month" />}
              />
              <NavLink
                component={Link}
                to={`/teams/${team.id}/squads`}
                label="Squads"
                leftSection={<div className="i-mdi:clipboard-text" />}
              />
            </NavLink>
          )}
        </ScrollArea>

        <Button
          variant="subtle"
          color="red"
          onClick={handleLogout}
          leftSection={<div className="i-mdi:logout" />}
          justify="start"
          fullWidth
          loading={isLoggingOut}
          disabled={isLoggingOut}
        >
          Logout
        </Button>
      </Stack>
    </AppShell.Navbar>
  );
};

type PlayerOption = ComboboxItem & Pick<Player, "name" | "pos">;

const PlayerSearch = () => {
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const supabase = useAtomValue(supabaseAtom);
  const team = useAtomValue(teamAtom)!;
  const onSearchChange = useCallback(
    async (input: string) => {
      clearTimeout(timeoutRef.current);
      if (!input || input.includes("·")) {
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        const { data } = await supabase
          .from("players")
          .select("id, name, pos")
          .or(`pos.ilike.%${input}%, name.ilike.%${input}%`)
          .eq("team_id", team.id)
          .order("pos_order");
        if (data) {
          setOptions(
            data.map((option) => ({
              ...option,
              label: `${option.pos} · ${option.name}`,
              value: String(option.id),
            })),
          );
        } else {
          setOptions([]);
        }
        setLoading(false);
      }, 300);
    },
    [supabase, team.id],
  );

  const navigate = useNavigate();
  const onChange = useCallback(
    (playerId: string | null) => {
      if (playerId) {
        navigate({ to: `/teams/${team.id}/players/${playerId}` });
      }
    },
    [navigate, team.id],
  );

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <Select
      data={options}
      onSearchChange={onSearchChange}
      onChange={onChange}
      leftSection={loading ? <Loader size="xs" type="dots" /> : null}
      searchable
      renderOption={({ option }) => {
        assertType<PlayerOption>(option);
        return (
          <Group gap="xs" wrap="nowrap">
            <MText size="xs" fw="bold">
              {option.pos}
            </MText>
            <MText size="xs">{option.name}</MText>
          </Group>
        );
      }}
      clearable
      placeholder="Search"
    />
  );
};
