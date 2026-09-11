export function Footer() {
  return (
    <footer
      style={{
        marginTop: "56px",
        paddingTop: "20px",
        borderTop: "1px solid var(--upguard-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "11.5px",
        color: "var(--upguard-text-muted)",
      }}
    >
      <span>
        Custos · el análisis corre en este dispositivo. Ninguna conversación, dirección o imagen se
        sube a un servidor.
      </span>
      <span className="mono">Tron Nile testnet · Decentralized AI Hackathon 2026</span>
    </footer>
  );
}
