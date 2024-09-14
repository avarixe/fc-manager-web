import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { theme } from "../theme";
import { createClient } from '@supabase/supabase-js';
import { AppShell, Burger, Container, Group, NavLink } from '@mantine/core';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useDisclosure } from "@mantine/hooks";

export const Route = createRootRoute({
  component: App,
})

const supabase = createClient(import.meta.env.VITE_APP_SUPABASE_URL, import.meta.env.VITE_APP_SUPABASE_KEY)

function App() {
  const [session, setSession] = useAtom(sessionAtom);

  const [opened, { toggle }] = useDisclosure();

  console.debug(session)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })

    return () => {
      subscription.unsubscribe();
    }
  }, [setSession])

  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            FC Manager
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <NavLink
            href="/"
            label="Home"
            leftSection={<div className="i-tabler:home"></div>}
          />
          <NavLink
            href="/teams"
            label="Select Team"
            leftSection={<div className="i-tabler:shield-cog"></div>}
          />
        </AppShell.Navbar>
        <AppShell.Main>
          <Container>
            {!session ? (
              <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
            ) : <Outlet />}
          </Container>
        </AppShell.Main>
      </AppShell>
      <TanStackRouterDevtools />
    </MantineProvider>
  )
}
