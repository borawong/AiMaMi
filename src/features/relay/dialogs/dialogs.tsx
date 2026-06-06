import { Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RelayPageController } from "../hooks";
import { ProviderFormFields } from "../panels/panels";
import type {
  RelayNetworkMode,
  RelayProviderForm,
  RelayProviderPreset,
  RelayProviderRow,
} from "../types";

export function RelayPageDialogs({
  controller,
}: {
  controller: RelayPageController;
}) {
  return (
    <>
      <ProviderDraftDialog
        open={controller.providerDialogOpen}
        form={controller.form}
        currentIde={controller.currentIde}
        locked={controller.locked}
        busy={controller.busy}
        formValid={controller.formValid}
        extraHeadersInvalid={controller.extraHeadersInvalid}
        modelOptions={controller.modelOptions}
        fetchingModels={controller.fetchingModels}
        testingDraft={controller.testingDraft}
        onOpenChange={controller.actions.setProviderDialogOpen}
        onChange={controller.actions.setForm}
        onFetchModels={() => void controller.actions.fetchModels()}
        onTestDraft={() => void controller.actions.testDraft()}
        onSave={(enableAfterSave) =>
          void controller.actions.saveProvider(enableAfterSave)
        }
      />
      <PresetDialog
        open={controller.presetDialogOpen}
        presets={controller.presetOptions}
        onOpenChange={controller.actions.setPresetDialogOpen}
        onSelect={controller.actions.applyPreset}
      />
      <NetworkDialog
        provider={controller.networkProvider}
        network={controller.networkDraft}
        pending={controller.module.providerActions.setNetwork.isPending}
        onNetworkChange={controller.actions.setNetworkDraft}
        onOpenChange={controller.actions.closeNetworkDialog}
        onSave={() => void controller.actions.saveNetwork()}
      />
      <DeleteProviderDialog
        provider={controller.deleteProvider}
        pending={
          controller.deleting ||
          controller.module.providerActions.deleteProvider.isPending
        }
        onOpenChange={controller.actions.closeDeleteDialog}
        onConfirm={() => void controller.actions.deleteProvider()}
      />
    </>
  );
}

function ProviderDraftDialog({
  open,
  form,
  currentIde,
  locked,
  busy,
  formValid,
  extraHeadersInvalid,
  modelOptions,
  fetchingModels,
  testingDraft,
  onOpenChange,
  onChange,
  onFetchModels,
  onTestDraft,
  onSave,
}: {
  open: boolean;
  form: RelayProviderForm;
  currentIde: string;
  locked: boolean;
  busy: boolean;
  formValid: boolean;
  extraHeadersInvalid: boolean;
  modelOptions: string[];
  fetchingModels: boolean;
  testingDraft: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: RelayProviderForm) => void;
  onFetchModels: () => void;
  onTestDraft: () => void;
  onSave: (enableAfterSave: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("relay.newProvider")}</DialogTitle>
          <DialogDescription>
            {t("relay.form.scope", { ide: t(`relay.ide.${currentIde}`) })}
          </DialogDescription>
        </DialogHeader>
        <ProviderFormFields
          form={form}
          disabled={locked || busy}
          extraHeadersInvalid={extraHeadersInvalid}
          modelOptions={modelOptions}
          fetchingModels={fetchingModels}
          onChange={onChange}
          onFetchModels={onFetchModels}
        />
        <DialogFooter className="!justify-between gap-2 sm:!justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!formValid || busy || testingDraft}
              aria-busy={testingDraft}
              onClick={onTestDraft}
            >
              <ButtonBusyContent
                busy={testingDraft}
                idleLabel={t("relay.test")}
                busyLabel={t("relay.test")}
              />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!formValid || locked || busy}
              onClick={() => onSave(false)}
            >
              {t("relay.save")}
            </Button>
            <Button
              type="button"
              disabled={!formValid || locked || busy}
              onClick={() => onSave(true)}
            >
              {t("relay.saveAndEnable")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PresetDialog({
  open,
  presets,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  presets: RelayProviderPreset[];
  onOpenChange: (open: boolean) => void;
  onSelect: (preset: RelayProviderPreset) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("relay.preset.title")}</DialogTitle>
          <DialogDescription>{t("relay.preset.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {presets.map((preset) => (
            <button
              key={preset.slug}
              type="button"
              className="flex items-center gap-3 rounded-[8px] border border-border p-3 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => onSelect(preset)}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold text-white"
                style={{ background: preset.color }}
              >
                {preset.initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {preset.name}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  {preset.baseUrl || "custom"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NetworkDialog({
  provider,
  network,
  pending,
  onNetworkChange,
  onOpenChange,
  onSave,
}: {
  provider: RelayProviderRow | null;
  network: RelayNetworkMode;
  pending: boolean;
  onNetworkChange: (network: RelayNetworkMode) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();

  if (!provider) return null;

  const currentNetwork = provider.network || "system";
  const changed = network !== currentNetwork;
  const options: Array<{
    value: RelayNetworkMode;
    titleKey: string;
    descKey: string;
  }> = [
    {
      value: "system",
      titleKey: "relay.network.option.system.title",
      descKey: "relay.network.option.system.desc",
    },
    {
      value: "direct",
      titleKey: "relay.network.option.direct.title",
      descKey: "relay.network.option.direct.desc",
    },
  ];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("relay.network.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("relay.network.dialog.description", { name: provider.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {options.map((option) => {
            const selected = network === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={pending}
                className={cn(
                  "group relative w-full rounded-[8px] border px-3.5 py-3 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30 hover:bg-accent",
                  pending && "cursor-not-allowed opacity-60",
                )}
                onClick={() => onNetworkChange(option.value)}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {t(option.titleKey)}
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-relaxed text-muted-foreground">
                      {t(option.descKey)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="rounded-[8px] bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("relay.network.dialog.tunHint")}
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("relay.network.dialog.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!changed || pending}
            aria-busy={pending}
            onClick={onSave}
          >
            <ButtonBusyContent
              busy={pending}
              idleLabel={t("relay.network.dialog.save")}
              busyLabel={t("relay.network.dialog.save")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProviderDialog({
  provider,
  pending,
  onOpenChange,
  onConfirm,
}: {
  provider: RelayProviderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={Boolean(provider)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("relay.delete")}</DialogTitle>
          <DialogDescription>{t("relay.confirmDelete")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            aria-busy={pending}
            onClick={onConfirm}
          >
            <ButtonBusyContent
              busy={pending}
              idleIcon={<Trash2 className="h-3.5 w-3.5" />}
              idleLabel={t("relay.delete")}
              busyLabel={t("relay.delete")}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
