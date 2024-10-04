import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SupabaseClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { AppShell, Burger, Container, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export const Route = createRootRoute({
  component: App,
});

function App() {
  const [supabase] = useAtom(supabaseAtom);
  const [session, setSession] = useAtom(sessionAtom);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, supabase.auth]);

  const [opened, { toggle }] = useDisclosure();
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div>MyFC Manager</div>
        </Group>
      </AppShell.Header>
      <AppNavbar />
      <AppShell.Main>
        <Container>
          {loading ? (
            <></>
          ) : !session ? (
            <Login supabase={supabase} />
          ) : (
            <Outlet />
          )}
        </Container>
      </AppShell.Main>
      <TanStackRouterDevtools />
    </AppShell>
  );
}

const Login = ({ supabase }: { supabase: SupabaseClient }) => {
  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl mb-4">
        Welcome to FC Manager!
      </h1>

      <Auth
        supabaseClient={supabase}
        providers={["google"]}
        onlyThirdPartyProviders
        appearance={{ theme: ThemeSupa }}
        redirectTo={window.location.href}
      />
    </>
  );
};
