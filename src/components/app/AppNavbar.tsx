import { AppShell, Avatar, NavLink } from "@mantine/core";

export const AppNavbar = () => {
  const team = useAtomValue(teamAtom);

  return (
    <AppShell.Navbar p="md">
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
          leftSection={<Avatar src={team.badge_path} />}
          mt="md"
          childrenOffset={28}
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
            component={Link}
            to={`/teams/${team.id}/players`}
            label="Players"
            leftSection={<div className="i-mdi:run" />}
          />
          <NavLink
            component={Link}
            to={`/teams/${team.id}/matches`}
            label="Matches"
            leftSection={<div className="i-mdi:soccer-field" />}
          />
          <NavLink
            component={Link}
            to={`/teams/${team.id}/competitions`}
            label="Competitions"
            leftSection={<div className="i-mdi:trophy" />}
          />
          <NavLink
            component={Link}
            to={`/teams/${team.id}/squads`}
            label="Squads"
            leftSection={<div className="i-mdi:clipboard-text" />}
          />
        </NavLink>
      )}
    </AppShell.Navbar>
  );
};
