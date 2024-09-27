import { Tables, TablesInsert } from '@/database-generated.types'
import { Button, Divider, FileInput, Progress, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/import')({
  component: ImportTeamPage,
})

async function parseJsonFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = event => resolve(JSON.parse(String(event.target?.result)))
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}

function ImportTeamPage() {
  const session = useAtomValue(sessionAtom)
  const supabase = useAtomValue(supabaseAtom)

  const [file, setFile] = useState<File | null>(null)
  const [disabled, setDisabled] = useState(true)

  const teamProgress = useProgress()
  const playerProgress = useProgress()
  const competitionProgress = useProgress()
  const squadProgress = useProgress()
  const matchProgress = useProgress()
  const appearanceProgress = useProgress()

  const idMap = useRef<Record<'player' | 'match' | 'cap', Record<string, number>>>({
    player: {},
    match: {},
    cap: {},
  })

  const importCapIds = useRef<(string | null)[]>([null])
  const capStats = useRef<Record<string, Record<string, Tables<'appearances'>>>>({})

  const importReadyCaps = useCallback(async (caps: Match['caps']) => {
    const readyCaps = []
    const notReadyCaps = []
    for (const cap of caps) {
      if (importCapIds.current.includes(cap.nextId)) {
        readyCaps.push(cap)
      } else {
        notReadyCaps.push(cap)
      }
    }

    const data: TablesInsert<'appearances'>[] = readyCaps.map(cap => ({
      importId: Number(cap.id),
      userId: session?.user.id,
      playerId: idMap.current.player[cap.playerId],
      matchId: idMap.current.match[cap.matchId],
      nextId: cap.nextId ? idMap.current.cap[cap.nextId] : null,
      pos: cap.pos,
      startMinute: cap.start,
      stopMinute: cap.stop,
      rating: cap.rating,
      injured: cap.injured,
      ovr: cap.ovr,
      numGoals: capStats.current[cap.playerId]?.[cap.matchId]?.numGoals ?? 0,
      numAssists: capStats.current[cap.playerId]?.[cap.matchId]?.numAssists ?? 0,
      numYellowCards: capStats.current[cap.playerId]?.[cap.matchId]?.numYellowCards ?? 0,
      numRedCards: capStats.current[cap.playerId]?.[cap.matchId]?.numRedCards ?? 0,
      cleanSheet: capStats.current[cap.playerId]?.[cap.matchId]?.cleanSheet ?? false,
    }))
    const { error } = await supabase.from('appearances').insert(data)
    if (error) {
      console.log(error)
      console.error(`Could not create caps! Error: ${error.message}`)
      return
    }

    importCapIds.current.push(...readyCaps.map(cap => cap.id))
    appearanceProgress.increment(data.length)

    if (!notReadyCaps.length) return

    // Update Cap id mapping
    const capIds = await supabase.from('appearances')
      .select('id, importId')
      .in('importId', notReadyCaps.map(cap => cap.nextId))
    for (const cap of capIds.data ?? []) {
      idMap.current.cap[cap.importId!] = cap.id
    }

    await importReadyCaps(notReadyCaps)
  }, [appearanceProgress, session?.user.id, supabase])

  const onClick = useCallback(async () => {
    if (!file) return

    setDisabled(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await parseJsonFile(file)
    const { players, competitions, squads, matches, ...teamData } = data

    assertType<Player[]>(players)
    assertType<Match[]>(matches)
    assertType<Competition[]>(competitions)
    assertType<Squad[]>(squads)

    const caps = matches.reduce((list: Match['caps'], match) => [...list, ...match.caps], [])

    teamProgress.setTotal(1)
    playerProgress.setTotal(players.length)
    competitionProgress.setTotal(competitions.length)
    squadProgress.setTotal(squads.length)
    matchProgress.setTotal(matches.length)
    appearanceProgress.setTotal(caps.length)

    // Create Team
    const userId = session?.user.id
    const { data: teamInsertData } = await supabase.from('teams').insert({
      userId,
      name: teamData.name,
      startedOn: teamData.startedOn,
      currentlyOn: teamData.currentlyOn,
      currency: teamData.currency,
      game: teamData.game,
      managerName: teamData.managerName,
      badgePath: teamData.badgePath,
    }).select()
    if (!teamInsertData?.length) {
      alert('Could not create team!')
      return
    }
    const teamId = teamInsertData[0].id
    teamProgress.increment()

    // Create Players
    const playerInsertData: TablesInsert<'players'>[] = players.map(player => ({
      teamId,
      userId,
      importId: Number(player.id),
      name: player.name,
      nationality: player.nationality,
      pos: player.pos,
      secPos: player.secPos,
      ovr: player.ovr,
      value: player.value,
      birthYear: player.birthYear,
      status: player.status,
      youth: player.youth,
      kitNo: player.kitNo,
      wage: player.status ? player.contracts[player.contracts.length - 1]?.wage : null,
      contractEndsOn: player.status ? player.contracts[player.contracts.length - 1]?.endedOn : null,
      histories: player.histories.map(history => ({
        date: history.recordedOn,
        ovr: history.ovr,
        value: history.value,
      })),
      contracts: player.contracts.map(contract => ({
        signedOn: contract.signedOn,
        startedOn: contract.startedOn,
        endedOn: contract.endedOn,
        wage: contract.wage,
        signingBonus: contract.signingBonus,
        releaseClause: contract.releaseClause,
        performanceBonus: contract.performanceBonus,
        bonusReq: contract.bonusReq,
        bonusReqType: contract.bonusReqType,
        conclusion: contract.conclusion,
      })),
      injuries: player.injuries.map(injury => ({
        startedOn: injury.startedOn,
        endedOn: injury.endedOn,
        description: injury.description,
      })),
      loans: player.loans.map(loan => ({
        signedOn: loan.signedOn,
        startedOn: loan.startedOn,
        endedOn: loan.endedOn,
        origin: loan.origin,
        destination: loan.destination,
        wagePercentage: loan.wagePercentage,
        transferFee: loan.transferFee,
        addonClause: loan.addonClause,
      })),
      transfers: player.transfers.map(transfer => ({
        signedOn: transfer.signedOn,
        movedOn: transfer.movedOn,
        origin: transfer.origin,
        destination: transfer.destination,
        fee: transfer.fee,
        addonClause: transfer.addonClause,
      }))
    }))
    const { error: playerInsertError } = await supabase.from('players').insert(playerInsertData)
    if (playerInsertError) {
      console.error(`Could not create players! Error: ${playerInsertError.message}`)
      return
    }
    playerProgress.increment(playerInsertData.length)

    // Create Player id mapping
    const playerIds = await supabase.from('players')
      .select('id, importId')
      .eq('teamId', teamId)
      .not('importId', 'is', null)
    for (const player of playerIds.data ?? []) {
      idMap.current.player[player.importId!] = player.id
    }

    // Create Squads
    const squadInsertData: TablesInsert<'squads'>[] = squads.map(squad => ({
      teamId,
      userId,
      name: squad.name,
      formation: squad.squadPlayers.reduce((formation: Record<string, number>, item) => {
        formation[item.pos] = idMap.current.player[item.playerId]
        return formation
      }, {})
    }))
    const { error: squadInsertError } = await supabase.from('squads').insert(squadInsertData)
    if (squadInsertError) {
      console.error(`Could not create squads! Error: ${squadInsertError.message}`)
      return
    }
    squadProgress.increment(squadInsertData.length)

    // Create Competitions
    const competitionInsertData: TablesInsert<'competitions'>[] = competitions.map(competition => ({
      teamId,
      userId,
      name: competition.name,
      season: competition.season,
      champion: competition.champion,
      stages: competition.stages.map(stage => ({
        name: stage.name,
        table: stage.tableRows.map(row => ({
          team: row.name,
          w: row.wins,
          d: row.draws,
          l: row.losses,
          gf: row.goalsFor,
          ga: row.goalsAgainst,
          gd: row.goalsDifference,
          pts: row.points,
        })),
        fixtures: stage.fixtures.map(fixture => ({
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          legs: fixture.legs.map(leg => ({
            homeScore: leg.homeScore,
            awayScore: leg.awayScore,
          })),
        })),
      })),
    }))
    const { error: competitionInsertError } = await supabase.from('competitions').insert(competitionInsertData)
    if (competitionInsertError) {
      console.error(`Could not create competitions! Error: ${competitionInsertError.message}`)
      return
    }
    competitionProgress.increment(competitionInsertData.length)

    // Create Matches
    const matchInsertData: TablesInsert<'matches'>[] = matches.map(match => ({
      teamId,
      userId,
      importId: Number(match.id),
      homeTeam: match.home,
      awayTeam: match.away,
      season: match.season,
      competition: match.competition,
      stage: match.stage,
      playedOn: match.playedOn,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeXg: match.homeXg,
      awayXg: match.awayXg,
      homePossession: match.homePossession,
      awayPossession: match.awayPossession,
      homePenaltyScore: match.penaltyShootout?.homeScore,
      awayPenaltyScore: match.penaltyShootout?.awayScore,
      extraTime: match.extraTime,
      friendly: false,
      goals: match.goals.map(goal => ({
        minute: goal.minute,
        playerName: goal.playerName,
        assistedBy: goal.assistedBy,
        home: goal.home,
        setPiece: goal.setPiece,
        ownGoal: goal.ownGoal,
      })),
      bookings: match.bookings.map(booking => ({
        minute: booking.minute,
        playerName: booking.playerName,
        home: booking.home,
        redCard: booking.redCard,
      })),
    }))
    const { error: matchInsertError } = await supabase.from('matches').insert(matchInsertData)
    if (matchInsertError) {
      console.error(`Could not create matches! Error: ${matchInsertError.message}!`)
      return
    }
    matchProgress.increment(matchInsertData.length)

    // Collate Appearance statistics
    for (const match of matches) {
      for (const goal of match.goals) {
        if (goal.playerId && !goal.ownGoal) {
          capStats.current[goal.playerId] = capStats.current[goal.playerId] || {}
          capStats.current[goal.playerId][match.id] = capStats.current[goal.playerId][match.id] || {}
          capStats.current[goal.playerId][match.id].numGoals = (capStats.current[goal.playerId][match.id].numGoals || 0) + 1
        }
        if (goal.assistId) {
          capStats.current[goal.assistId] = capStats.current[goal.assistId] || {}
          capStats.current[goal.assistId][match.id] = capStats.current[goal.assistId][match.id] || {}
          capStats.current[goal.assistId][match.id].numAssists = (capStats.current[goal.assistId][match.id].numAssists || 0) + 1
        }
      }
      for (const booking of match.bookings) {
        if (booking.playerId) {
          capStats.current[booking.playerId] = capStats.current[booking.playerId] || {}
          capStats.current[booking.playerId][match.id] = capStats.current[booking.playerId][match.id] || {}
          if (booking.redCard) {
            capStats.current[booking.playerId][match.id].numRedCards = (capStats.current[booking.playerId][match.id].numRedCards || 0) + 1
          } else {
            capStats.current[booking.playerId][match.id].numYellowCards = (capStats.current[booking.playerId][match.id].numYellowCards || 0) + 1
          }
        }
      }
      const cleanSheet = (match.home === teamData.name && match.awayScore === 0) ||
        (teamData.name === match.away && match.homeScore === 0)
      for (const cap of match.caps) {
        capStats.current[cap.playerId] = capStats.current[cap.playerId] || {}
        capStats.current[cap.playerId][match.id] = capStats.current[cap.playerId][match.id] || {}
        capStats.current[cap.playerId][match.id].cleanSheet = cleanSheet
      }
    }

    // Create Match id mapping
    const matchIds = await supabase.from('matches')
      .select('id, importId')
      .eq('teamId', teamId)
      .not('importId', 'is', null)
    for (const match of matchIds.data ?? []) {
      idMap.current.match[match.importId!] = match.id
    }

    // Create Appearances
    await importReadyCaps(caps)
  }, [file, teamProgress, playerProgress, competitionProgress, squadProgress, matchProgress, appearanceProgress, session?.user.id, supabase, importReadyCaps])

  return (
    <>
      <Title mb="xl">Import Team</Title>

      <FileInput
        value={file}
        onChange={(file) => {
          setFile(file)
          setDisabled(false)
        }}
        label="Upload File"
        placeholder="JSON File"
        accept=".json"
        required
        mb="xl"
      />
      <Button disabled={disabled} onClick={onClick}>Import</Button>

      {teamProgress.total > 0 && <Divider my="xl" />}

      <ImportProgress label="Team" color="yellow" {...teamProgress} />
      <ImportProgress label="Competitions" color="cyan" {...competitionProgress} />
      <ImportProgress label="Players" color="pink" {...playerProgress} />
      <ImportProgress label="Squads" color="indigo" {...squadProgress} />
      <ImportProgress label="Matches" color="lime" {...matchProgress} />
      <ImportProgress label="Performances" color="grape" {...appearanceProgress} />
    </>
  )
}

const ImportProgress: React.FC<{
  label: string;
  color: string;
  progress: number;
  count: number;
  total: number;
}> = ({ label, color, progress, count, total }) => (
  total > 0 ? (
    <>
      <MText size="sm" mt="xs" c={color}>
        Importing {label}...
        <span className="ml-1">{progress >= 100 && 'Done!'}</span>
      </MText>
      <Progress.Root size="xl">
        <Progress.Section value={progress} animated={progress < 100} color={color}>
          <Progress.Label>({count}/{total})</Progress.Label>
        </Progress.Section>
      </Progress.Root>
    </>
  ) : null
)

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
