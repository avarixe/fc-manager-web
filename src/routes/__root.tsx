import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { AppShell, Burger, Container, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export const Route = createRootRoute({
  component: App,
})

const supabase = createClient(import.meta.env.VITE_APP_SUPABASE_URL, import.meta.env.VITE_APP_SUPABASE_KEY)

function App() {
  const [session, setSession] = useAtom(sessionAtom);
  const [loading, setLoading] = useState(true);

  const [opened, { toggle }] = useDisclosure();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          <div>MyFC Manager</div>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <NavLink component={Link} label="Home" to="/" leftSection={<div className="i-tabler:home" />} />
        <NavLink component={Link} label="Select Team" to="/teams" leftSection={<div className="i-tabler:shield-cog" />} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Container>
          {loading ? <></> : !session ? (
            <Login supabase={supabase} />
          ) : <>
            <h1 className="text-lg font-semibold md:text-2xl mb-4">
              TODO: Page Title
            </h1>

            <Outlet />
          </>}
        </Container>
      </AppShell.Main>
      <TanStackRouterDevtools />
    </AppShell>
  )
}

const Login = ({ supabase } : { supabase: SupabaseClient }) => {
  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl mb-4">
        Welcome to FC Manager!
      </h1>

      <Auth supabaseClient={supabase} providers={['google']} appearance={{ theme: ThemeSupa }} />
    </>
  )
}
