import ReactCountryFlag from "react-country-flag";

export const PlayerFlag = ({ nationality }: { nationality: string }) => {
  const countryCode = countryCodes[nationality];

  return <ReactCountryFlag countryCode={countryCode} svg />;
};
