import type { MethodSettings } from "./methodSettings";

export function normalizeMethodSettingsForSubmit(settings: MethodSettings): MethodSettings {
  const steps = settings.steps
    .map((step, index) => ({
      ...step,
      step: step.step.trim() || String(index + 1).padStart(2, "0"),
      title: step.title.trim(),
      text: step.text.trim(),
    }))
    .filter((step) => step.title || step.text)
    .slice(0, 6);

  return {
    eyebrow: settings.eyebrow.trim(),
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    steps,
  };
}
