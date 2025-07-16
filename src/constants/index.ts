export const positions = [
  "GK",
  "LB",
  "LWB",
  "CB",
  "RB",
  "RWB",
  "LM",
  "CDM",
  "CM",
  "CAM",
  "RM",
  "LW",
  "CF",
  "ST",
  "RW",
];

export enum MatchPosType {
  DEF = "DEF",
  MID = "MID",
  FWD = "FWD",
}

export const matchPositionTypes: Record<string, MatchPosType> = {
  LW: MatchPosType.FWD,
  LS: MatchPosType.FWD,
  ST: MatchPosType.FWD,
  RS: MatchPosType.FWD,
  LF: MatchPosType.FWD,
  CF: MatchPosType.FWD,
  RF: MatchPosType.FWD,
  RW: MatchPosType.FWD,
  LAM: MatchPosType.MID,
  CAM: MatchPosType.MID,
  RAM: MatchPosType.MID,
  LM: MatchPosType.MID,
  LDM: MatchPosType.MID,
  LCM: MatchPosType.MID,
  CDM: MatchPosType.MID,
  CM: MatchPosType.MID,
  RDM: MatchPosType.MID,
  RCM: MatchPosType.MID,
  RM: MatchPosType.MID,
  LB: MatchPosType.DEF,
  LWB: MatchPosType.DEF,
  LCB: MatchPosType.DEF,
  CB: MatchPosType.DEF,
  RCB: MatchPosType.DEF,
  RB: MatchPosType.DEF,
  RWB: MatchPosType.DEF,
  GK: MatchPosType.DEF,
};

export const matchPositions = Object.keys(matchPositionTypes);

export const matchPosTypes: MatchPosType[] = Object.values(MatchPosType);

export const positionsByType = positions.reduce(
  (acc, pos) => {
    const type = matchPositionTypes[pos];
    return {
      ...acc,
      [type]: [...(acc[type] || []), pos],
    };
  },
  {} as Record<MatchPosType, string[]>,
);

export enum PlayerEventKey {
  Contract = "contracts",
  Injury = "injuries",
  Loan = "loans",
  Transfer = "transfers",
}

export enum PlayerEventType {
  Contract = "Contract",
  Injury = "Injury",
  Loan = "Loan",
  Transfer = "Transfer",
}

export enum PlayerStatusFilter {
  All = "All",
  Youth = "Youth",
  Active = "Active",
  Injured = "Injured",
  Loaned = "Loaned",
  Pending = "Pending",
}

export enum PlayerPositionFilter {
  GK = "GK",
  DEF = "DEF",
  MID = "MID",
  FWD = "FWD",
}
