import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export const Route = createRootRoute({
  component: App,
})

const supabase = createClient(import.meta.env.VITE_APP_SUPABASE_URL, import.meta.env.VITE_APP_SUPABASE_KEY)

function App() {
  const [session, setSession] = useAtom(sessionAtom);
  const [loading, setLoading] = useState(true);

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
    <div>
      <h1>FC Manager</h1>
      <Link to="/">Home</Link>
      <Link to="/teams">Select Team</Link>
      {loading ? <></> : !session ? (
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
      ) : <Outlet />}
      <TanStackRouterDevtools />
    </div>
  )
}
