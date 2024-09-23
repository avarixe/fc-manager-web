import { Tables } from '@/database-generated.types'
import { Button, Divider, FileInput, Progress, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/import')({
  component: ImportTeam,
})

async function parseJsonFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = event => resolve(JSON.parse(String(event.target?.result)))
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}

function ImportTeam() {
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

  const idMap = useRef<Record<'player' | 'competition' | 'squad' | 'match' | 'cap', Record<string, number>>>({
    player: {},
    competition: {},
    squad: {},
    match: {},
    cap: {},
  })

  const importCapIds = useRef<(string | null)[]>([null])
  const capStats = useRef<Record<string, Record<string, Tables<'appearances'>>>>({})

  const importReadyCaps = useCallback(async (caps) => {
    const readyCaps = []
    const notReadyCaps = []
    for (const cap of caps) {
      if (importCapIds.current.includes(cap.nextId)) {
        readyCaps.push(cap)
      } else {
        notReadyCaps.push(cap)
      }
    }

    let abort = false
    await Promise.all(
      readyCaps.map(async (cap) => {
        const args = {
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
        }
        const { data, error } = await supabase.from('appearances').insert(args).select()
        if (!data?.length) {
          console.log(error)
          console.log(args)
          console.error(`Could not create cap ${cap.id}!`)
          abort = true
          return
        }
        idMap.current.cap[cap.id] = data[0].id
        importCapIds.current.push(cap.id)
        appearanceProgress.increment()
      })
    )

    if (!notReadyCaps.length || abort) return
    await importReadyCaps(notReadyCaps)
  }, [appearanceProgress, session?.user.id, supabase])

  const onClick = useCallback(async () => {
    if (!file) return

    setDisabled(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await parseJsonFile(file)
    const { players, competitions, squads, matches, ...teamData } = data

    const caps = matches.reduce((list, match) => [...list, ...match.caps], [])

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
    await Promise.all(
      players.map(async (player) => {
        const { data: playerInsertData } = await supabase.from('players').insert({
          teamId,
          userId,
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
        }).select()
        if (!playerInsertData?.length) {
          console.error(`Could not create player ${player.id}!`)
          return
        }
        idMap.current.player[player.id] = playerInsertData[0].id
        playerProgress.increment()
      })
    )

    // Create Squads
    squads.forEach(async (squad) => {
      const { data: squadInsertData } = await supabase.from('squads').insert({
        teamId,
        userId,
        name: squad.name,
        formation: squad.squadPlayers.reduce((formation, item) => {
          formation[item.pos] = idMap.current.player[item.playerId]
          return formation
        }, {}),
      }).select()
      if (!squadInsertData?.length) {
        console.error(`Could not create squad ${squad.id}!`)
        return
      }
      idMap.current.squad[squad.id] = squadInsertData[0].id
      squadProgress.increment()
    })

    // Create Competitions
    competitions.forEach(async (competition) => {
      const { error } = await supabase.from('competitions').insert({
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
        }))
      }).select()
      if (error) {
        console.error(`Could not create competition ${competition.id}!`)
        return
      }
      competitionProgress.increment()
    })

    // Create Matches
    await Promise.all(
      matches.map(async (match) => {
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
        const cleanSheet = (match.homeTeam === teamData.name && match.awayScore === 0) ||
          (teamData.name === match.awayTeam && match.homeScore === 0)
        for (const cap of match.caps) {
          capStats.current[cap.playerId] = capStats.current[cap.playerId] || {}
          capStats.current[cap.playerId][match.id] = capStats.current[cap.playerId][match.id] || {}
          capStats.current[cap.playerId][match.id].cleanSheet = cleanSheet
        }

        const { data: matchInsertData, error } = await supabase.from('matches').insert({
          teamId,
          userId,
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
          friendly: match.friendly,
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
        }).select()
        console.log(error)
        if (!matchInsertData?.length) {
          console.error(`Could not create match ${match.id}!`)
          return
        }
        idMap.current.match[match.id] = matchInsertData[0].id
        matchProgress.increment()
      })
    )

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
