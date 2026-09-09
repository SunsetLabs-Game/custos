/**
 * BCP-47-ish language tag. Kept as a branded string rather than an enum
 * because TranslatePsy's supported-language set is defined by the model,
 * not by this codebase — see adapters-qvac for the concrete list.
 */
export type LanguageTag = string & { readonly __brand: "LanguageTag" };

export function languageTag(tag: string): LanguageTag {
  if (!tag || tag.length > 35) {
    throw new Error(`Invalid language tag: "${tag}"`);
  }
  return tag as LanguageTag;
}
