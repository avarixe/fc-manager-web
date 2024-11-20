import { Box, BoxProps } from "@mantine/core";

export const BaseIcon: React.FC<
  BoxProps & {
    name: string;
  }
> = ({ name, ...props }) => (
  <Box className={`${name} ${props.className}`} {...props} />
);

export const ContractIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:file-sign" c="indigo" {...props} />
);

export const InjuryIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:ambulance" c="pink" {...props} />
);

export const LoanIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:transit-transfer" c="orange" {...props} />
);

export const TransferIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:airplane" c="green" {...props} />
);

export const TransferInIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:airplane-landing" c="green" {...props} />
);

export const TransferOutIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:airplane-takeoff" c="red" {...props} />
);

export const GoalIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:soccer" c="blue" {...props} />
);

export const AssistIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:shoe-cleat -rotate-45" c="blue.2" {...props} />
);

export const YellowCardIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:card rotate-90" c="yellow" {...props} />
);

export const RedCardIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:card rotate-90" c="red.6" {...props} />
);

export const SubInIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:arrow-right-bottom" c="green" {...props} />
);

export const SubOutIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:arrow-left-bottom" c="red" {...props} />
);

export const SubstitutionIcon: React.FC<BoxProps> = (props) => (
  <BaseIcon name="i-mdi:repeat" c="green" {...props} />
);
