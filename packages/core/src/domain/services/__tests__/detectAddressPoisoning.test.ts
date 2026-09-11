import { describe, expect, it } from "vitest";
import { detectAddressPoisoning } from "../detectAddressPoisoning.js";
import type { Address } from "../../entities/Address.js";

function addr(value: string, network: Address["network"] = "tron"): Address {
  return { value, network };
}

describe("detectAddressPoisoning", () => {
  it("flags a candidate sharing the first/last characters of a known recipient", () => {
    const known = addr("TAbc12300000000000000000000WXYZ99");
    const candidate = addr("TAbc123DIFFERENTMIDDLESECTIONWXYZ99");

    const match = detectAddressPoisoning(candidate, [known]);

    expect(match).toBeDefined();
    expect(match?.pattern.category).toBe("address-poisoning");
  });

  it("does not flag an exact match to a known recipient", () => {
    const known = addr("TAbc12300000000000000000000WXYZ99");

    const match = detectAddressPoisoning(known, [known]);

    expect(match).toBeUndefined();
  });

  it("does not flag an address unrelated to any known recipient", () => {
    const known = addr("TAbc12300000000000000000000WXYZ99");
    const candidate = addr("TQqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq11");

    const match = detectAddressPoisoning(candidate, [known]);

    expect(match).toBeUndefined();
  });

  it("does not flag across different networks even with matching characters", () => {
    const known = addr("TAbc12300000000000000000000WXYZ99", "tron");
    const candidate = addr("TAbc123DIFFERENTMIDDLESECTIONWXYZ99", "ethereum");

    const match = detectAddressPoisoning(candidate, [known]);

    expect(match).toBeUndefined();
  });

  it("returns undefined when there is no send history yet", () => {
    const candidate = addr("TAbc12300000000000000000000WXYZ99");

    const match = detectAddressPoisoning(candidate, []);

    expect(match).toBeUndefined();
  });
});

describe("the address used by the web demo's poisoning preset", () => {
  // Guards against the preset drifting into an address that shares only the
  // prefix — which silently scores "no risk" and makes the demo look broken.
  const known = { value: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", network: "tron" } as const;
  const preset = { value: "TR7NHqjeKQxGTCi8q8ZY4pL8ot5zgjLj6t", network: "tron" } as const;

  it("is a genuine lookalike of the seeded recent recipient", () => {
    const match = detectAddressPoisoning(preset, [known]);
    expect(match).toBeDefined();
    expect(match!.pattern.category).toBe("address-poisoning");
  });

  it("differs from the known address only in the middle", () => {
    expect(preset.value).not.toBe(known.value);
    expect(preset.value.slice(0, 6)).toBe(known.value.slice(0, 6));
    expect(preset.value.slice(-6)).toBe(known.value.slice(-6));
    expect(preset.value).toHaveLength(34);
  });
});
