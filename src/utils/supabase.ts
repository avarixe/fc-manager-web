import { createClient } from "@supabase/supabase-js";

import { Database } from "@/database-generated.types";

export const supabase = createClient<Database>(
  import.meta.env.VITE_APP_SUPABASE_URL,
  import.meta.env.VITE_APP_SUPABASE_KEY,
  {
    db: {
      schema: "public",
    },
    auth: {
      autoRefreshToken: true,
    },
  },
);
