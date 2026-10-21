import { Search } from "lucide-react";

/** Plain GET form so verification works even without JavaScript. */
export function VerifyForm({ defaultValue = "", size = "md", buttonLabel = "Verify Now", autoFocus = false }: { defaultValue?: string; size?: "md" | "lg"; buttonLabel?: string; autoFocus?: boolean }) {
  return (
    <form action="/verify" method="get" role="search" className="flex w-full flex-col gap-2.5 sm:flex-row">
      <label htmlFor={`cert-${size}`} className="sr-only">Certificate number</label>
      <input
        id={`cert-${size}`}
        name="q"
        defaultValue={defaultValue}
        required
        maxLength={40}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder="Enter certificate number"
        className={`input flex-1 uppercase placeholder:normal-case ${size === "lg" ? "py-3.5 text-base" : ""}`}
      />
      <button type="submit" className={`btn-navy ${size === "lg" ? "px-7 py-3.5 text-base" : "px-6"}`}>
        <Search className="h-4 w-4" aria-hidden /> {buttonLabel}
      </button>
    </form>
  );
}
