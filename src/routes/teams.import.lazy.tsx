import { Tables, TablesInsert } from "@/database-generated.types";
import {
  Button,
  Divider,
  FileInput,
  Progress,
  Stack,
  Title,
} from "@mantine/core";

export const Route = createLazyFileRoute("/teams/import")({
  component: ImportTeamPage,
});

async function parseJsonFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) =>
      resolve(JSON.parse(String(event.target?.result)));
    fileReader.onerror = (error) => reject(error);
    fileReader.readAsText(file);
  });
}

function ImportTeamPage() {
  const session = useAtomValue(sessionAtom);
  const supabase = useAtomValue(supabaseAtom);

  const [file, setFile] = useState<File | null>(null);
  const [disabled, setDisabled] = useState(true);

  const teamProgress = useProgress();
  const playerProgress = useProgress();
  const competitionProgress = useProgress();
  const squadProgress = useProgress();
  const matchProgress = useProgress();
  const appearanceProgress = useProgress();

  const idMap = useRef<
    Record<"player" | "match" | "cap", Record<string, number>>
  >({
    player: {},
    match: {},
    cap: {},
  });

  const importCapIds = useRef<(string | null)[]>([null]);
  const capStats = useRef<
    Record<string, Record<string, Tables<"appearances">>>
  >({});

  const importReadyCaps = useCallback(
    async (caps: Match["caps"]) => {
      const readyCaps = [];
      const notReadyCaps = [];
      for (const cap of caps) {
        if (importCapIds.current.includes(cap.nextId)) {
          readyCaps.push(cap);
        } else {
          notReadyCaps.push(cap);
        }
      }

      const data: TablesInsert<"appearances">[] = readyCaps.map((cap) => ({
        import_id: Number(cap.id),
        user_id: session?.user.id,
        player_id: idMap.current.player[cap.playerId],
        match_id: idMap.current.match[cap.matchId],
        next_id: cap.nextId ? idMap.current.cap[cap.nextId] : null,
        pos: cap.pos,
        start_minute: cap.start,
        stop_minute: cap.stop,
        rating: cap.rating,
        injured: cap.injured,
        ovr: cap.ovr,
        num_goals:
          capStats.current[cap.playerId]?.[cap.matchId]?.num_goals ?? 0,
        num_assists:
          capStats.current[cap.playerId]?.[cap.matchId]?.num_assists ?? 0,
        num_yellow_cards:
          capStats.current[cap.playerId]?.[cap.matchId]?.num_yellow_cards ?? 0,
        num_red_cards:
          capStats.current[cap.playerId]?.[cap.matchId]?.num_red_cards ?? 0,
        clean_sheet:
          capStats.current[cap.playerId]?.[cap.matchId]?.clean_sheet ?? false,
      }));
      const { error } = await supabase.from("appearances").insert(data);
      if (error) {
        console.log(error);
        console.error(`Could not create caps! Error: ${error.message}`);
        return;
      }

      importCapIds.current.push(...readyCaps.map((cap) => cap.id));
      appearanceProgress.increment(data.length);

      if (!notReadyCaps.length) return;

      // Update Cap id mapping
      const capIds = await supabase
        .from("appearances")
        .select("id, import_id")
        .in(
          "import_id",
          notReadyCaps.map((cap) => cap.nextId),
        );
      for (const cap of capIds.data ?? []) {
        idMap.current.cap[cap.import_id!] = cap.id;
      }

      await importReadyCaps(notReadyCaps);
    },
    [appearanceProgress, session?.user.id, supabase],
  );

  const onClick = useCallback(async () => {
    if (!file) return;

    setDisabled(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await parseJsonFile(file);
    const { players, competitions, squads, matches, ...teamData } = data;

    assertType<Player[]>(players);
    assertType<Match[]>(matches);
    assertType<Competition[]>(competitions);
    assertType<Squad[]>(squads);

    const caps = matches.reduce(
      (list: Match["caps"], match) => [...list, ...match.caps],
      [],
    );

    teamProgress.setTotal(1);
    playerProgress.setTotal(players.length);
    competitionProgress.setTotal(competitions.length);
    squadProgress.setTotal(squads.length);
    matchProgress.setTotal(matches.length);
    appearanceProgress.setTotal(caps.length);

    // Create Team
    const userId = session?.user.id;
    const { data: teamInsertData } = await supabase
      .from("teams")
      .insert({
        user_id: userId,
        name: teamData.name,
        started_on: teamData.startedOn,
        currently_on: teamData.currentlyOn,
        currency: teamData.currency,
        game: teamData.game,
        manager_name: teamData.managerName,
        badge_path: teamData.badgePath,
      })
      .select();
    if (!teamInsertData?.length) {
      alert("Could not create team!");
      return;
    }
    const teamId = teamInsertData[0].id;
    teamProgress.increment();

    // Create Players
    const playerInsertData: TablesInsert<"players">[] = players.map(
      (player) => ({
        team_id: teamId,
        user_id: userId,
        import_id: Number(player.id),
        name: player.name,
        nationality: player.nationality,
        pos: player.pos,
        sec_pos: player.secPos,
        ovr: player.ovr,
        value: player.value,
        birth_year: player.birthYear,
        status: player.status,
        youth: player.youth,
        kit_no: player.kitNo,
        wage: player.status
          ? player.contracts[player.contracts.length - 1]?.wage
          : null,
        contract_ends_on: player.status
          ? player.contracts[player.contracts.length - 1]?.endedOn
          : null,
        history: player.histories.reduce(
          (items: Record<string, { ovr: number; value: number }>, item) => ({
            ...items,
            [item.recordedOn]: {
              ovr: item.ovr,
              value: item.value,
            },
          }),
          {},
        ),
        contracts: player.contracts.map((contract) => ({
          signed_on: contract.signedOn,
          started_on: contract.startedOn,
          ended_on: contract.endedOn,
          wage: contract.wage,
          signing_bonus: contract.signingBonus,
          release_clause: contract.releaseClause,
          performance_bonus: contract.performanceBonus,
          bonus_req: contract.bonusReq,
          bonus_req_type: contract.bonusReqType,
          conclusion: contract.conclusion,
        })),
        injuries: player.injuries.map((injury) => ({
          started_on: injury.startedOn,
          ended_on: injury.endedOn,
          description: injury.description,
        })),
        loans: player.loans.map((loan) => ({
          signed_on: loan.signedOn,
          started_on: loan.startedOn,
          ended_on: loan.endedOn,
          origin: loan.origin,
          destination: loan.destination,
          wage_percentage: loan.wagePercentage,
          transfer_fee: loan.transferFee,
          addon_clause: loan.addonClause,
        })),
        transfers: player.transfers.map((transfer) => ({
          signed_on: transfer.signedOn,
          moved_on: transfer.movedOn,
          origin: transfer.origin,
          destination: transfer.destination,
          fee: transfer.fee,
          addon_clause: transfer.addonClause,
        })),
      }),
    );
    const { error: playerInsertError } = await supabase
      .from("players")
      .insert(playerInsertData);
    if (playerInsertError) {
      console.error(
        `Could not create players! Error: ${playerInsertError.message}`,
      );
      return;
    }
    playerProgress.increment(playerInsertData.length);

    // Create Player id mapping
    const playerIds = await supabase
      .from("players")
      .select("id, import_id")
      .eq("team_id", teamId)
      .not("import_id", "is", null);
    for (const player of playerIds.data ?? []) {
      idMap.current.player[player.import_id!] = player.id;
    }

    // Create Squads
    const squadInsertData: TablesInsert<"squads">[] = squads.map((squad) => ({
      team_id: teamId,
      user_id: userId,
      name: squad.name,
      formation: squad.squadPlayers.reduce(
        (formation: Record<string, number>, item) => {
          formation[item.pos] = idMap.current.player[item.playerId];
          return formation;
        },
        {},
      ),
    }));
    const { error: squadInsertError } = await supabase
      .from("squads")
      .insert(squadInsertData);
    if (squadInsertError) {
      console.error(
        `Could not create squads! Error: ${squadInsertError.message}`,
      );
      return;
    }
    squadProgress.increment(squadInsertData.length);

    // Create Competitions
    const competitionInsertData: TablesInsert<"competitions">[] =
      competitions.map((competition) => ({
        team_id: teamId,
        user_id: userId,
        name: competition.name,
        season: competition.season,
        champion: competition.champion,
        stages: competition.stages.map((stage) => ({
          name: stage.name,
          table: stage.tableRows.map((row) => ({
            team: row.name,
            w: row.wins,
            d: row.draws,
            l: row.losses,
            gf: row.goalsFor,
            ga: row.goalsAgainst,
            gd: row.goalsDifference,
            pts: row.points,
          })),
          fixtures: stage.fixtures.map((fixture) => ({
            home_team: fixture.homeTeam,
            away_team: fixture.awayTeam,
            legs: fixture.legs.map((leg) => ({
              home_score: leg.homeScore,
              away_score: leg.awayScore,
            })),
          })),
        })),
      }));
    const { error: competitionInsertError } = await supabase
      .from("competitions")
      .insert(competitionInsertData);
    if (competitionInsertError) {
      console.error(
        `Could not create competitions! Error: ${competitionInsertError.message}`,
      );
      return;
    }
    competitionProgress.increment(competitionInsertData.length);

    // Create Matches
    const matchInsertData: TablesInsert<"matches">[] = matches.map((match) => ({
      team_id: teamId,
      user_id: userId,
      import_id: Number(match.id),
      home_team: match.home,
      away_team: match.away,
      season: match.season,
      competition: match.competition,
      stage: match.stage,
      played_on: match.playedOn,
      home_score: match.homeScore,
      away_score: match.awayScore,
      home_xg: match.homeXg,
      away_xg: match.awayXg,
      home_possession: match.homePossession,
      away_possession: match.awayPossession,
      home_penalty_score: match.penaltyShootout?.homeScore,
      away_penalty_score: match.penaltyShootout?.awayScore,
      extra_time: match.extraTime,
      friendly: false,
      goals: match.goals.map((goal) => ({
        minute: goal.minute,
        player_name: goal.playerName,
        assisted_by: goal.assistedBy,
        home: goal.home,
        set_piece: goal.setPiece,
        own_goal: goal.ownGoal,
      })),
      bookings: match.bookings.map((booking) => ({
        minute: booking.minute,
        player_name: booking.playerName,
        home: booking.home,
        red_card: booking.redCard,
      })),
    }));
    const { error: matchInsertError } = await supabase
      .from("matches")
      .insert(matchInsertData);
    if (matchInsertError) {
      console.error(
        `Could not create matches! Error: ${matchInsertError.message}!`,
      );
      return;
    }
    matchProgress.increment(matchInsertData.length);

    // Collate Appearance statistics
    let numGoals = 0;
    for (const match of matches) {
      for (const goal of match.goals) {
        if (goal.playerId && !goal.ownGoal) {
          capStats.current[goal.playerId] =
            capStats.current[goal.playerId] || {};
          capStats.current[goal.playerId][match.id] =
            capStats.current[goal.playerId][match.id] || {};
          capStats.current[goal.playerId][match.id].num_goals =
            (capStats.current[goal.playerId][match.id].num_goals || 0) + 1;
          numGoals++;
        }
        if (goal.assistId) {
          capStats.current[goal.assistId] =
            capStats.current[goal.assistId] || {};
          capStats.current[goal.assistId][match.id] =
            capStats.current[goal.assistId][match.id] || {};
          capStats.current[goal.assistId][match.id].num_assists =
            (capStats.current[goal.assistId][match.id].num_assists || 0) + 1;
        }
      }
      for (const booking of match.bookings) {
        if (booking.playerId) {
          capStats.current[booking.playerId] =
            capStats.current[booking.playerId] || {};
          capStats.current[booking.playerId][match.id] =
            capStats.current[booking.playerId][match.id] || {};
          if (booking.redCard) {
            capStats.current[booking.playerId][match.id].num_red_cards =
              (capStats.current[booking.playerId][match.id].num_red_cards ||
                0) + 1;
          } else {
            capStats.current[booking.playerId][match.id].num_yellow_cards =
              (capStats.current[booking.playerId][match.id].num_yellow_cards ||
                0) + 1;
          }
        }
      }
      const cleanSheet =
        (match.home === teamData.name && match.awayScore === 0) ||
        (teamData.name === match.away && match.homeScore === 0);
      for (const cap of match.caps) {
        capStats.current[cap.playerId] = capStats.current[cap.playerId] || {};
        capStats.current[cap.playerId][match.id] =
          capStats.current[cap.playerId][match.id] || {};
        capStats.current[cap.playerId][match.id].clean_sheet = cleanSheet;
      }
    }
    console.log("processed goals: ", numGoals);

    // Create Match id mapping
    const matchIds = await supabase
      .from("matches")
      .select("id, import_id")
      .eq("team_id", teamId)
      .not("import_id", "is", null);
    for (const match of matchIds.data ?? []) {
      idMap.current.match[match.import_id!] = match.id;
    }

    // Create Appearances
    await importReadyCaps(caps);
  }, [
    file,
    teamProgress,
    playerProgress,
    competitionProgress,
    squadProgress,
    matchProgress,
    appearanceProgress,
    session?.user.id,
    supabase,
    importReadyCaps,
  ]);

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Import Team
      </Title>

      <FileInput
        value={file}
        onChange={(file) => {
          setFile(file);
          setDisabled(false);
        }}
        label="Upload File"
        placeholder="JSON File"
        accept=".json"
        required
        mb="xl"
      />
      <Button disabled={disabled} onClick={onClick}>
        Import
      </Button>

      {teamProgress.total > 0 && <Divider my="xl" />}

      <ImportProgress label="Team" color="yellow" {...teamProgress} />
      <ImportProgress
        label="Competitions"
        color="cyan"
        {...competitionProgress}
      />
      <ImportProgress label="Players" color="pink" {...playerProgress} />
      <ImportProgress label="Squads" color="indigo" {...squadProgress} />
      <ImportProgress label="Matches" color="lime" {...matchProgress} />
      <ImportProgress
        label="Performances"
        color="grape"
        {...appearanceProgress}
      />
    </Stack>
  );
}

const ImportProgress: React.FC<{
  label: string;
  color: string;
  progress: number;
  count: number;
  total: number;
}> = ({ label, color, progress, count, total }) =>
  total > 0 ? (
    <>
      <MText size="sm" mt="xs" c={color}>
        Importing {label}...
        <span className="ml-1">{progress >= 100 && "Done!"}</span>
      </MText>
      <Progress.Root size="xl">
        <Progress.Section
          value={progress}
          animated={progress < 100}
          color={color}
        >
          <Progress.Label>
            ({count}/{total})
          </Progress.Label>
        </Progress.Section>
      </Progress.Root>
    </>
  ) : null;

interface Player {
  id: string;
  name: string;
  nationality: string | null;
  pos: string;
  secPos: string[];
  ovr: number;
  value: number;
  status: string | null;
  youth: boolean;
  kitNo: number | null;
  birthYear: number;
  contracts: {
    signedOn: string;
    startedOn: string;
    endedOn: string;
    wage: number;
    signingBonus: number;
    releaseClause: number;
    performanceBonus: number;
    bonusReq: number;
    bonusReqType: string;
    conclusion: string;
  }[];
  histories: {
    recordedOn: string;
    ovr: number;
    value: number;
  }[];
  injuries: {
    startedOn: string;
    endedOn: string;
    description: string;
  }[];
  loans: {
    signedOn: string;
    startedOn: string;
    endedOn: string;
    origin: string;
    destination: string;
    wagePercentage: number;
    transferFee: number;
    addonClause: number;
  }[];
  transfers: {
    signedOn: string;
    movedOn: string;
    origin: string;
    destination: string;
    fee: number;
    addonClause: number;
  }[];
}

interface Match {
  id: string;
  home: string;
  away: string;
  competition: string;
  stage: string | null;
  playedOn: string;
  extraTime: boolean;
  homeScore: number;
  awayScore: number;
  homeXg: number | null;
  awayXg: number | null;
  homePossession: number | null;
  awayPossession: number | null;
  season: number;
  caps: {
    id: string;
    matchId: string;
    playerId: string;
    nextId: string | null;
    pos: string;
    start: number;
    stop: number;
    ovr: number;
    rating: number;
    injured: boolean;
  }[];
  goals: {
    home: boolean;
    playerId: string;
    playerName: string;
    assistId: string | null;
    assistedBy: string | null;
    minute: number;
    setPiece: string;
    ownGoal: boolean;
  }[];
  bookings: {
    home: boolean;
    playerId: string;
    playerName: string;
    minute: number;
    redCard: boolean;
  }[];
  penaltyShootout: {
    homeScore: number;
    awayScore: number;
  } | null;
}

interface Competition {
  name: string;
  season: number;
  champion: string;
  stages: {
    name: string;
    tableRows: {
      name: string;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalsDifference: number;
      points: number;
    }[];
    fixtures: {
      homeTeam: string;
      awayTeam: string;
      legs: {
        homeScore: number;
        awayScore: number;
      }[];
    }[];
  }[];
}

interface Squad {
  name: string;
  squadPlayers: {
    pos: string;
    playerId: string;
  }[];
}
