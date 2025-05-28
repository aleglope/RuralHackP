import React from "react";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react";

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const supportedLanguages = [
    { code: "gl", name: t("language.gl") },
    { code: "es", name: t("language.es") },
    { code: "en", name: t("language.en") },
  ];

  const currentLanguage = supportedLanguages.find(
    (lang) => lang.code === i18n.language
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t("language.selectLanguage") || "Select language"}
          className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <LanguagesIcon className="h-5 w-5 mr-2" />
          <span className="truncate max-w-[100px]">
            {currentLanguage ? currentLanguage.name : t("language.select")}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={5}
          className="z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {supportedLanguages.map((lang) => (
            <DropdownMenu.Item
              key={lang.code}
              onSelect={() => i18n.changeLanguage(lang.code)}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              {i18n.language === lang.code && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <CheckIcon className="h-4 w-4" />
                </span>
              )}
              <span className="pl-8">{lang.name}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default LanguageSelector;
