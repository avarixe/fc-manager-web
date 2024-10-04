import { Box } from "@mantine/core";

interface PlayerFlagProps extends React.HTMLAttributes<HTMLDivElement> {
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
        return "i-tabler:user-check";
      case "Loaned":
        return "i-tabler:transfer";
      case "Injured":
        return "i-tabler:ambulance";
      case "Pending":
        return "i-tabler:clock";
      default:
        return "i-tabler:minus";
    }
  }, [status]);

  return <Box c={color} className={`${icon} w-auto`} {...rest} />;
};
