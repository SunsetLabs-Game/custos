import type { Address } from "../entities/Address.js";
import type { ScamMatch, ScamPattern } from "../entities/ScamPattern.js";

// An attacker mines a vanity address sharing these many leading/trailing
// characters with a real address the victim has sent to before, then plants
// it in their history via a zero-value transfer — banking on the victim
// eyeballing only the ends of the address (or autocompleting from history)
// instead of comparing it in full.
const PREFIX_LENGTH = 6;
const SUFFIX_LENGTH = 6;

const ADDRESS_POISONING_PATTERN: ScamPattern = {
  id: "address-poisoning-lookalike",
  category: "address-poisoning",
  description:
    "A destination address that closely resembles (same first/last characters as) an address the user has sent to before, planted via a zero-value transfer to poison the recipient's history/autocomplete.",
  heuristics: [],
};

/**
 * Flags `candidate` as a suspected poisoning attempt if it isn't an exact
 * match for any address in `recentRecipients` but shares that address's
 * first/last few characters — the structural signal an attacker relies on,
 * independent of any chat text. `recentRecipients` is caller-supplied (the
 * app's own send history); this function has no storage concerns of its own.
 */
export function detectAddressPoisoning(
  candidate: Address,
  recentRecipients: readonly Address[],
): ScamMatch | undefined {
  const candidateValue = candidate.value.toLowerCase();

  const lookalike = recentRecipients.find((known) => {
    if (known.network !== candidate.network) return false;
    const knownValue = known.value.toLowerCase();
    if (knownValue === candidateValue) return false; // exact match is the genuine, trusted address

    return (
      candidateValue.length >= PREFIX_LENGTH + SUFFIX_LENGTH &&
      knownValue.length >= PREFIX_LENGTH + SUFFIX_LENGTH &&
      candidateValue.slice(0, PREFIX_LENGTH) === knownValue.slice(0, PREFIX_LENGTH) &&
      candidateValue.slice(-SUFFIX_LENGTH) === knownValue.slice(-SUFFIX_LENGTH)
    );
  });

  if (!lookalike) return undefined;

  return {
    pattern: ADDRESS_POISONING_PATTERN,
    // High but not maximal: the address-length/edit-distance shortcut here
    // can't rule out a coincidental match as confidently as an exact
    // known-scam-list hit does.
    confidence: 0.9,
    evidenceSnippet: `Resembles a previous recipient: ${lookalike.value}`,
  };
}
