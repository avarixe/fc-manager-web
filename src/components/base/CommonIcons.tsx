import { Box, BoxProps } from "@mantine/core";

interface IconProps extends BoxProps {
  size?: number;
}

export const BaseIcon: React.FC<
  IconProps & {
    name: string;
  }
> = ({ name, size, ...props }) => (
  <Box
    className={`${name} ${props.className} h-${size || 4} w-${size || 4}`}
    {...props}
  />
);

export const ContractIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:file-sign" c="indigo" {...props} />
);

export const InjuryIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:ambulance" c="pink" {...props} />
);

export const LoanIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:transit-transfer" c="orange" {...props} />
);

export const TransferIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:airplane" c="green" {...props} />
);

export const TransferInIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:airplane-landing" c="green" {...props} />
);

export const TransferOutIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:airplane-takeoff" c="red" {...props} />
);

export const GoalIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:soccer" c="blue" {...props} />
);

export const AssistIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:shoe-cleat -rotate-45" c="blue.2" {...props} />
);

export const YellowCardIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:card rotate-90" c="yellow" {...props} />
);

export const RedCardIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:card rotate-90" c="red.6" {...props} />
);

export const SubInIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:arrow-right-bottom" c="green" {...props} />
);

export const SubOutIcon: React.FC<IconProps> = ({ size, ...props }) => (
  <BaseIcon name="i-mdi:arrow-left-bottom" c="red" {...props} />
);
