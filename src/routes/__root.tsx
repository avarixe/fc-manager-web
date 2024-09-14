import "@mantine/core/styles.css";
import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { theme } from "../theme";
import { createClient } from '@supabase/supabase-js';
import { Container } from '@mantine/core';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export const Route = createRootRoute({
  component: App,
})

const supabase = createClient(import.meta.env.VITE_APP_SUPABASE_URL, import.meta.env.VITE_APP_SUPABASE_KEY)

function App() {
  const [session, setSession] = useAtom(sessionAtom);

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
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </div>
      <hr />
      <Container>
        {!session ? (
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
        ) : <Outlet />}
      </Container>
      <TanStackRouterDevtools />
    </MantineProvider>
  )
}
