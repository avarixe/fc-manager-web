import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
    <ThemeProvider defaultTheme="dark">
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                {/* TODO: logo here */}
                <span>FC Manager</span>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                  <div className="i-tabler:home h-4 w-4" />
                  Home
                </Link>
                <Link to="/teams" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                  <div className="i-tabler:shield-cog h-4 w-4" />
                  Select Team
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <div className="i-tabler:menu h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                  <a className="flex items-center gap-2 text-lg font-semibold">
                    {/* TODO: logo here */}
                    <span className="sr-only">FC Manager</span>
                  </a>
                  <Link to="/" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                    <div className="i-tabler:home h-5 w-5" />
                    Home
                  </Link>
                  <Link to="/teams" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                    <div className="i-tabler:shield-cog h-5 w-5" />
                    Select Team
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              TODO: Team Name
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="container">
              {loading ? <></> : !session ? (
                <Login supabase={supabase} />
              ) : <>
                <h1 className="text-lg font-semibold md:text-2xl mb-4">
                  TODO: Page Title
                </h1>

                <Outlet />
              </>}
            </div>
          </main>
        </div>
      </div>
      <TanStackRouterDevtools />
    </ThemeProvider>
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
