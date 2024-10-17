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

export const matchPositionTypes: Record<string, "FWD" | "MID" | "DEF"> = {
  LW: "FWD",
  LS: "FWD",
  ST: "FWD",
  RS: "FWD",
  LF: "FWD",
  CF: "FWD",
  RF: "FWD",
  RW: "FWD",
  LAM: "MID",
  CAM: "MID",
  RAM: "MID",
  LM: "MID",
  LDM: "MID",
  LCM: "MID",
  CDM: "MID",
  CM: "MID",
  RDM: "MID",
  RCM: "MID",
  RM: "MID",
  LB: "DEF",
  LWB: "DEF",
  LCB: "DEF",
  CB: "DEF",
  RCB: "DEF",
  RB: "DEF",
  RWB: "DEF",
  GK: "DEF",
};

export const matchPositions = Object.keys(matchPositionTypes);

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
