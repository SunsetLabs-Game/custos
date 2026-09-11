import { useState } from "react";
import { Icon } from "../Icon.js";

export interface PresetItem {
  id: string;
  category: string;
  name: string;
  description: string;
  address: string;
  amount: string;
  chatText: string;
  expectedRisk: "safe" | "elevated" | "critical";
  /** The exact phrases in `chatText` that the seed patterns match on. */
  triggers: string[];
  /** What the engine does with that score, in the user's terms. */
  outcome: string;
  /** Why this scam works on a real victim. */
  why: string;
}

const RISK_META: Record<
  PresetItem["expectedRisk"],
  { label: string; color: string; icon: string }
> = {
  safe: { label: "Sin riesgo", color: "var(--color-safe)", icon: "verified" },
  elevated: { label: "Riesgo alto", color: "var(--color-elevated)", icon: "warning" },
  critical: { label: "Crítico", color: "var(--color-critical)", icon: "block" },
};

export function PresetsTab({
  onLoadPreset,
}: {
  onLoadPreset: (preset: { address: string; context: string; amount: string }) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const presets: PresetItem[] = [
    {
      id: "pig-butchering",
      category: "Pig butchering",
      name: "Mentor de inversiones y falso retiro",
      description: "Retornos garantizados con depósito previo para desbloquear un retiro inventado.",
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      amount: "2",
      chatText:
        "Hola! Tu profesor de inversión te garantiza un 30% de retorno diario. Para desbloquear el retiro de tus $150 USDT de ganancias en la plataforma VIP, debes depositar 2 USDT antes de las 6 PM.",
      expectedRisk: "elevated",
      triggers: ["profesor de inversión", "desbloquear el retiro", "plataforma vip", "antes de las"],
      outcome: "El botón de firma exige una confirmación explícita.",
      why: "La víctima ya ve un saldo inflado en una plataforma falsa; el depósito parece el último paso para cobrarlo.",
    },
    {
      id: "fake-support",
      category: "Soporte falso",
      name: "Verificación de cuenta congelada",
      description: "Transferencia a una “dirección segura” bajo pretexto de congelamiento.",
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      amount: "0.5",
      chatText:
        "Soporte Oficial de Billetera: Su cuenta ha sido marcada por verificación de seguridad. Envíe 0.5 USDT a la dirección segura de verificación para comprobar la titularidad de su billetera.",
      expectedRisk: "elevated",
      triggers: ["soporte oficial", "dirección segura", "cuenta congelada"],
      outcome: "El botón de firma exige una confirmación explícita.",
      why: "Se hace pasar por el equipo de soporte y usa el miedo a perder la cuenta para que no se verifique nada.",
    },
    {
      id: "recovery-scam",
      category: "Recuperación de fondos",
      name: "Falso agente de inteligencia blockchain",
      description: "Promete recuperar fondos robados cobrando una tarifa por adelantado.",
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      amount: "0.3",
      chatText:
        "Somos investigadores de blockchain. Hemos rastreado sus USDT robados. Para proceder con el rescate y retorno a su billetera, transfiera la tarifa de recuperación de 0.3 USDT.",
      expectedRisk: "elevated",
      triggers: ["investigadores de blockchain", "tarifa de recuperación"],
      outcome: "El botón de firma exige una confirmación explícita.",
      why: "Ataca a quien ya fue estafado una vez — la esperanza de recuperar el dinero baja las defensas.",
    },
    {
      id: "address-poisoning",
      category: "Address poisoning",
      name: "Dirección parecida a un receptor frecuente",
      description: "Mismos 6 primeros y 6 últimos caracteres que un destinatario del historial.",
      // Genuine lookalike of TR7NHq…gjLj6t: same ends, different middle.
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8ot5zgjLj6t",
      amount: "1",
      chatText: "",
      expectedRisk: "critical",
      triggers: ["mismos 6 primeros y 6 últimos caracteres", "sin chat: la señal está en la dirección"],
      outcome: "Bloqueo: no se prepara ninguna transacción.",
      why: "El atacante mina una dirección que empieza y termina igual que una ya usada, y la planta en tu historial con un envío de 0 USDT. Nadie compara los 34 caracteres del medio.",
    },
    {
      id: "romance-urgency",
      category: "Romance y presión",
      name: "Emergencia médica o de aduana",
      description: "Contacto romántico urgente pidiendo una transferencia inmediata y en secreto.",
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      amount: "1.2",
      chatText:
        "Mi amor estoy varado en la aduana del aeropuerto y no me dejan salir. Paga la cuota de aduana de 1.2 USDT ahora mismo por favor, no le digas a nadie mantén esto en secreto.",
      expectedRisk: "elevated",
      triggers: ["cuota de aduana", "varado en el aeropuerto", "no le digas a nadie", "mantén esto en secreto"],
      outcome: "El botón de firma exige una confirmación explícita.",
      why: "Combina vínculo afectivo, urgencia y secreto — el secreto evita que un familiar detenga el envío.",
    },
    {
      id: "clean-send",
      category: "Transferencia legítima",
      name: "Pago normal a billetera verificada",
      description: "Sin lenguaje sospechoso ni coincidencia con patrones de estafa.",
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      amount: "0.5",
      chatText: "Hola, aquí te envío los 0.5 USDT correspondientes al pago del diseño del logotipo. Saludos!",
      expectedRisk: "safe",
      triggers: [],
      outcome: "La firma queda habilitada sin fricción.",
      why: "Control negativo: comprueba que el detector no bloquea pagos normales.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="section-head">
        <span className="eyebrow">Casos de prueba</span>
        <h2>Escenarios listos para evaluar</h2>
        <p>
          Cada caso carga la dirección, el monto y el chat en el escudo. El veredicto no está
          preescrito: lo calcula el mismo detector que corre en tu navegador, así que puedes
          comprobar que las frases marcadas abajo son las que realmente disparan la alerta.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {presets.map((preset) => {
          const meta = RISK_META[preset.expectedRisk];
          const isOpen = expanded === preset.id;

          return (
            <article
              key={preset.id}
              className="card-flush"
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Icon name={meta.icon} size={15} style={{ color: meta.color, flexShrink: 0 }} />
                  <span
                    className="mono"
                    style={{ fontSize: "10px", color: "var(--upguard-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    {preset.category}
                  </span>
                  <span
                    className="mono"
                    style={{ marginLeft: "auto", fontSize: "10px", color: meta.color, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    {meta.label}
                  </span>
                </div>

                <strong style={{ fontSize: "14px", color: "var(--upguard-text-headings)", display: "block", marginBottom: "6px" }}>
                  {preset.name}
                </strong>
                <p style={{ fontSize: "12.5px", color: "var(--upguard-text-body)", margin: "0 0 14px", lineHeight: 1.5 }}>
                  {preset.description}
                </p>

                {/* What the detector will key on */}
                {preset.triggers.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <span className="eyebrow" style={{ marginBottom: "6px" }}>
                      Lo que detecta
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {preset.triggers.map((trigger) => (
                        <span
                          key={trigger}
                          className="mono"
                          style={{
                            fontSize: "10.5px",
                            color: meta.color,
                            background: "var(--upguard-bg)",
                            borderRadius: "var(--radius-badge)",
                            padding: "3px 7px",
                          }}
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected outcome — states what will happen before you click */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "12px" }}>
                  <Icon name="shield" size={13} style={{ color: meta.color, flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "12px", color: "var(--upguard-text-body)", lineHeight: 1.45 }}>
                    {preset.outcome}
                  </span>
                </div>

                <dl style={{ margin: 0, borderTop: "1px solid var(--upguard-border)", paddingTop: "4px" }}>
                  <div className="kv">
                    <dt>Monto</dt>
                    <dd>{preset.amount} USDT</dd>
                  </div>
                  <div className="kv">
                    <dt>Destino</dt>
                    <dd>
                      {preset.address.slice(0, 6)}…{preset.address.slice(-4)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : preset.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "10px 0 0",
                    color: "var(--color-info)",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {isOpen ? "Ocultar detalle" : "Ver el mensaje y por qué funciona"}
                  <span style={{ transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.18s ease" }}>
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {preset.chatText ? (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--upguard-text-body)",
                          lineHeight: 1.55,
                          margin: 0,
                          paddingLeft: "10px",
                          borderLeft: `2px solid ${meta.color}`,
                          fontStyle: "italic",
                        }}
                      >
                        “{preset.chatText}”
                      </p>
                    ) : (
                      <p style={{ fontSize: "12px", color: "var(--upguard-text-muted)", margin: 0, fontStyle: "italic" }}>
                        Este caso no lleva chat: la señal está solo en la dirección.
                      </p>
                    )}

                    <p style={{ fontSize: "12px", color: "var(--upguard-text-muted)", margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--upguard-text-body)" }}>Por qué funciona: </strong>
                      {preset.why}
                    </p>
                  </div>
                )}
              </div>

              <button
                className="btn-secondary"
                style={{ width: "100%", fontSize: "12.5px" }}
                onClick={() =>
                  onLoadPreset({ address: preset.address, context: preset.chatText, amount: preset.amount })
                }
              >
                <Icon name="play_arrow" size={15} />
                <span>Cargar en el escudo</span>
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
