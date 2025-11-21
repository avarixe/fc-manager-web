import {
  AppShell,
  Burger,
  Container,
  Group,
  Image,
  LoadingOverlay,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { SupabaseClient } from "@supabase/supabase-js";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import googleSsoButton from "@/assets/google-sso-button.png";
import logo from "@/assets/logo.png";
import { appLoadingAtom, sessionAtom } from "@/atoms";
import { AppBreadcrumbs } from "@/components/app/AppBreadcrumbs";
import { AppNavbar } from "@/components/app/AppNavbar";
import { supabase } from "@/utils/supabase";

export const Route = createRootRoute({
  component: App,
});

function App() {
  const [session, setSession] = useAtom(sessionAtom);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  const [opened, { toggle }] = useDisclosure();
  const appLoading = useAtomValue(appLoadingAtom);
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "md",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
          <Group gap="xs">
            <Image src={logo} alt="logo" height={48} fit="contain" flex={1} />
            <Text size="xl">MyFC Manager</Text>
          </Group>
        </Group>
      </AppShell.Header>
      <AppNavbar />
      <AppShell.Main>
        <Container>
          {!ready ? (
            <></>
          ) : !session ? (
            <Login supabase={supabase} />
          ) : (
            <>
              <AppBreadcrumbs />
              <Outlet />
            </>
          )}
          <LoadingOverlay
            visible={appLoading}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        </Container>
      </AppShell.Main>
      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </AppShell>
  );
}

const Login = ({ supabase }: { supabase: SupabaseClient }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  }, [supabase]);

  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl mb-4">
        Welcome to MyFC Manager!
      </h1>

      <UnstyledButton
        onClick={handleLogin}
        disabled={isLoggingIn}
        p={0}
        style={{ border: "none" }}
      >
        <Image
          src={googleSsoButton}
          alt="Sign in with Google"
          height={40}
          fit="contain"
        />
      </UnstyledButton>
    </>
  );
};
