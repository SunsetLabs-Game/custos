# @custos/adapters-p2p

`LocalRiskListAdapter` is a complete, working local-only `RiskListPort` — use
it in `apps/web` by default so the app is demoable without the P2P stretch
goal.

`HyperswarmRiskListAdapter` wraps it and adds Hyperswarm (Pears Stack) gossip
sync — this is the stretch goal that additionally qualifies the "valued but
not required" Pears bonus mentioned in the Track 03 rules. See the
`TODO(sdk-integration)` comments before implementing the wire protocol.
