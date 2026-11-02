import { Checkbox, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { DEFAULT_DNS64 } from "@/utils/nat64";

export function Nat64Option({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <Flex direction="column" gap="1" mb="2">
      <Text as="label" size="2" className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={enabled} onCheckedChange={(checked) => onChange(checked === true)} />
        {t("admin.nodeTable.nat64Option")}
      </Text>
      <Text size="1" color="gray">{t("admin.nodeTable.nat64OptionTip", { dns: DEFAULT_DNS64 })}</Text>
    </Flex>
  );
}
