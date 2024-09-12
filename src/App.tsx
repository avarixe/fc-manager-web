import "@mantine/core/styles.css";
import { theme } from "./theme";
import { createClient } from "@supabase/supabase-js";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Auth } from "@supabase/auth-ui-react";
import { Container } from "@mantine/core";

const supabase = createClient(import.meta.env.VITE_APP_SUPABASE_URL, import.meta.env.VITE_APP_SUPABASE_KEY)

export default function App() {
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
  }, [])

  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      {!session ? (
        <Container>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
        </Container>
      ) : (
        <div>App</div>
      )}
    </MantineProvider>
  );
}
