/**
 * The "invisible" demo wallet: generated once on first visit and kept in
 * localStorage, so the user never installs an extension or pastes a seed to
 * try a real on-chain send. Nile testnet only — see tronNetwork.assertTestnet.
 */
const STORAGE_KEY = "custos.demo.wallet.nile.v1";
const COUNTERPARTY_KEY = "custos.demo.counterparty.nile.v1";

export interface DemoWallet {
  readonly address: string;
  readonly privateKey: string;
}

function read(): DemoWallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoWallet>;
    if (typeof parsed.address !== "string" || typeof parsed.privateKey !== "string") return null;
    return { address: parsed.address, privateKey: parsed.privateKey };
  } catch {
    return null;
  }
}

/**
 * Returns the persisted wallet, generating one on first call. The env override
 * lets a pre-funded key be supplied at build time so a fresh browser can send
 * immediately instead of waiting on the faucet.
 */
export async function getOrCreateDemoWallet(): Promise<DemoWallet> {
  const configuredKey = import.meta.env.VITE_TRON_DEMO_PRIVATE_KEY as string | undefined;
  if (configuredKey && configuredKey.trim()) {
    const { TronWeb } = await import("tronweb");
    const privateKey = configuredKey.trim();
    return { address: TronWeb.address.fromPrivateKey(privateKey) as string, privateKey };
  }

  const existing = read();
  if (existing) return existing;

  const { TronWeb } = await import("tronweb");
  const account = await TronWeb.createAccount();
  const wallet: DemoWallet = {
    address: account.address.base58,
    privateKey: account.privateKey,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
  } catch {
    // Private window / storage disabled: the wallet still works for this session.
  }
  return wallet;
}

/**
 * A second address the demo can send to, so the "clean send" path completes a
 * real on-chain transfer instead of pointing at an arbitrary address.
 */
export async function getDemoCounterpartyAddress(): Promise<string> {
  try {
    const stored = localStorage.getItem(COUNTERPARTY_KEY);
    if (stored) return stored;
  } catch {
    // fall through to generating an ephemeral one
  }

  const { TronWeb } = await import("tronweb");
  const account = await TronWeb.createAccount();
  const address = account.address.base58;
  try {
    localStorage.setItem(COUNTERPARTY_KEY, address);
  } catch {
    // non-persistent is fine
  }
  return address;
}
