import ReactCountryFlag from "react-country-flag";

import { countryCodes } from "@/constants/countryCodes";

export const PlayerFlag = ({ nationality }: { nationality: string }) => {
  const countryCode = countryCodes[nationality];

  return <ReactCountryFlag countryCode={countryCode} svg />;
};
