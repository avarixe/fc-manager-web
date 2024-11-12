import { Breadcrumbs, Button } from "@mantine/core";

export const AppBreadcrumbs = () => {
  const items = useAtomValue(breadcrumbsAtom);

  return (
    <Breadcrumbs>
      {items.map((item, index) => (
        <Button
          component={Link}
          to={item.to}
          variant="transparent"
          size="compact-sm"
          activeOptions={{ exact: true }}
          disabled={index === items.length - 1}
          key={index}
          p={0}
          bg="transparent"
        >
          {item.title}
        </Button>
      ))}
    </Breadcrumbs>
  );
};
