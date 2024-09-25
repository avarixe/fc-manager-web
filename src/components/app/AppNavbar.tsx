import { AppShell, Avatar, NavLink } from "@mantine/core"

export const AppNavbar = () => {
  const team = useAtomValue(teamAtom)

  return (
    <AppShell.Navbar p="md">
      <NavLink component={Link} label="Home" to="/" leftSection={<div className="i-tabler:home" />} />
      <NavLink component={Link} label="Teams" to="/teams" activeOptions={{ exact: true }} leftSection={<div className="i-tabler:shield-half-filled" />} />

      {team && (
        <>
          <NavLink
            label={team.name}
            leftSection={<Avatar src={team.badgePath} />}
            mt="md"
            childrenOffset={28}
            defaultOpened
          >
            <NavLink
              component={Link}
              to={`/teams/${team.id}`}
              activeOptions={{ exact: true }}
              label="Dashboard"
              leftSection={<div className="i-tabler:layout-dashboard" />}
            />
            <NavLink
              component={Link}
              to={`/teams/${team.id}/players`}
              label="Players"
              leftSection={<div className="i-tabler:shirt-sport" />}
            />
            <NavLink
              component={Link}
              to={`/teams/${team.id}/matches`}
              label="Matches"
              leftSection={<div className="i-tabler:soccer-field" />}
            />
            <NavLink
              component={Link}
              to={`/teams/${team.id}/competitions`}
              label="Competitions"
              leftSection={<div className="i-tabler:trophy" />}
            />
            <NavLink
              component={Link}
              to={`/teams/${team.id}/squads`}
              label="Squads"
              leftSection={<div className="i-tabler:topology-ring-3" />}
            />
          </NavLink>
        </>
      )}
    </AppShell.Navbar>
  )
}
