import { BoxProps } from "@mantine/core";

interface PlayerFlagProps extends BoxProps {
  status: string | null;
}

export const PlayerStatus = ({ status, ...rest }: PlayerFlagProps) => {
  const color = useMemo(() => {
    switch (status) {
      case "Active":
        return "green";
      case "Loaned":
        return "orange";
      case "Injured":
        return "pink";
      case "Pending":
        return "yellow";
      default:
        return "";
    }
  }, [status]);

  const icon = useMemo(() => {
    switch (status) {
      case "Active":
        return "i-mdi:account-check";
      case "Loaned":
        return "i-mdi:transit-transfer";
      case "Injured":
        return "i-mdi:ambulance";
      case "Pending":
        return "i-mdi:lock-clock";
      default:
        return "i-mdi:minus";
    }
  }, [status]);

  return <BaseIcon c={color} name={icon} {...rest} />;
};
