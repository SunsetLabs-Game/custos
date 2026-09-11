import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon.js";

function useRevealOnView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    // Already on screen at mount: show it immediately rather than animating
    // something the reader is looking at.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);

    // Never let content stay invisible because the observer didn't fire
    // (short viewports, restored scroll position, screenshot capture).
    const fallback = setTimeout(() => {
      setVisible(true);
      observer.disconnect();
    }, 1500);

    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return { ref, visible };
}

const ANALYSIS_STEPS = [
  {
    icon: "search",
    title: "Dirección + contexto",
    description: "Pega el destino y, si lo tienes, el chat del remitente.",
  },
  {
    icon: "hub",
    title: "Heurísticas y directorio",
    description: "Se cruza contra patrones de estafa y direcciones ya reportadas.",
  },
  {
    icon: "memory",
    title: "Análisis en el dispositivo",
    description: "El texto se traduce y clasifica localmente. Nada sale del navegador.",
  },
  {
    icon: "shield",
    title: "Decisión",
    description: "Permite firmar, exige confirmación o bloquea el envío.",
    branches: true,
  },
];

/**
 * These mirror what the detector actually returns: a keyword hit scores 0.6 →
 * "alto" (friction), while only a reported address forces a hard block.
 */
const RISK_EXAMPLES = [
  {
    tier: "safe",
    grade: "Sin riesgo",
    icon: "verified",
    label: "Pago legítimo",
    example: "“Hola, aquí te envío los 0.5 USDT del pago del logotipo. Saludos!”",
    outcomeIcon: "verified",
    outcomeLabel: "Se firma y se envía",
    color: "var(--color-safe)",
  },
  {
    tier: "elevated",
    grade: "Riesgo alto",
    icon: "warning",
    label: "Pig butchering",
    example: "“Tu profesor de inversión garantiza un 30% diario. Transfiere 2 USDT para desbloquear tus ganancias.”",
    outcomeIcon: "shield_alert",
    outcomeLabel: "Exige confirmación explícita",
    color: "var(--color-elevated)",
  },
  {
    tier: "critical",
    grade: "Crítico",
    icon: "block",
    label: "Dirección ya reportada",
    example: "El destino aparece en el directorio de estafas, reportado aquí o recibido de otro par.",
    outcomeIcon: "lock",
    outcomeLabel: "No se prepara transacción",
    color: "var(--color-critical)",
  },
];

export function Landing({
  onStart,
  onLoadPreset,
}: {
  onStart: () => void;
  onLoadPreset: (preset: { address: string; context: string; amount: string }) => void;
}) {
  const [heroAddressInput, setHeroAddressInput] = useState("");
  const diagram = useRevealOnView<HTMLDivElement>();
  const examples = useRevealOnView<HTMLDivElement>();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroAddressInput.trim()) {
      onLoadPreset({ address: heroAddressInput.trim(), context: "", amount: "1" });
    } else {
      onStart();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "72px", paddingBottom: "40px" }}>
      {/* 1 — HERO */}
      <section style={{ paddingTop: "28px", maxWidth: "760px" }}>
        <span className="eyebrow">Escudo anti-estafa para envíos USDT</span>
        <h1
          style={{
            fontSize: "clamp(30px, 4.4vw, 46px)",
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "var(--upguard-text-headings)",
            margin: "0 0 16px",
          }}
        >
          Revisa a dónde va tu USDT antes de firmar.
        </h1>
        <p style={{ fontSize: "16px", lineHeight: 1.6, color: "var(--upguard-text-body)", margin: "0 0 28px", maxWidth: "560px" }}>
          Custos analiza la dirección de destino y el chat del remitente en tu propio navegador, y
          deshabilita la firma cuando detecta un patrón de estafa conocido.
        </p>

        <form
          onSubmit={handleHeroSearch}
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--upguard-layer-soft)",
            border: "1px solid var(--upguard-border-strong)",
            borderRadius: "var(--radius-card)",
            padding: "6px 6px 6px 16px",
            maxWidth: "580px",
          }}
        >
          <Icon name="search" size={18} style={{ color: "var(--upguard-text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            value={heroAddressInput}
            onChange={(e) => setHeroAddressInput(e.target.value)}
            placeholder="Pega una dirección de destino…"
            className="mono"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--upguard-text-headings)",
              fontSize: "13.5px",
              padding: "0 14px",
              minWidth: 0,
            }}
          />
          <button type="submit" className="btn-upguard-primary" style={{ padding: "10px 20px", fontSize: "13.5px" }}>
            Analizar
          </button>
        </form>

        <p style={{ margin: "14px 0 0", fontSize: "12px", color: "var(--upguard-text-muted)" }}>
          Incluye una wallet de prueba en Tron Nile, sin instalar nada.
        </p>
      </section>

      {/* 2 — HOW IT WORKS */}
      <section>
        <div className="section-head">
          <span className="eyebrow">Cómo funciona</span>
          <h2>Cuatro etapas antes de que exista una transacción</h2>
        </div>

        <div
          ref={diagram.ref}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "28px 20px",
            opacity: diagram.visible ? 1 : 0,
            transform: diagram.visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div
            className="flow-line"
            style={{
              position: "absolute",
              top: "21px",
              left: "12.5%",
              right: "12.5%",
              height: "1px",
              background: "linear-gradient(90deg, var(--color-safe), var(--color-elevated), var(--color-critical))",
              opacity: 0.3,
              zIndex: 0,
            }}
          >
            <span className="flow-dot" style={{ animationDelay: "0s" }} />
            <span className="flow-dot" style={{ animationDelay: "1.3s" }} />
            <span className="flow-dot" style={{ animationDelay: "2.6s" }} />
          </div>

          {ANALYSIS_STEPS.map((step, index) => (
            <div key={step.title} style={{ position: "relative", zIndex: 1 }}>
              {step.branches ? (
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background:
                      "conic-gradient(var(--color-safe) 0deg 120deg, var(--color-elevated) 120deg 240deg, var(--color-critical) 240deg 360deg)",
                    padding: "1.5px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "var(--upguard-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--upguard-text-headings)",
                    }}
                  >
                    <Icon name={step.icon} size={18} />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "var(--upguard-layer-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--upguard-text-headings)",
                  }}
                >
                  <Icon name={step.icon} size={18} />
                </div>
              )}

              <span
                className="mono"
                style={{ fontSize: "10px", color: "var(--upguard-text-muted)", display: "block", margin: "14px 0 6px" }}
              >
                0{index + 1}
              </span>
              <strong style={{ fontSize: "13.5px", color: "var(--upguard-text-headings)", display: "block", marginBottom: "4px" }}>
                {step.title}
              </strong>
              <p style={{ fontSize: "12.5px", color: "var(--upguard-text-body)", margin: 0, lineHeight: 1.5, maxWidth: "230px" }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — EXAMPLES */}
      <section>
        <div className="section-head">
          <span className="eyebrow">Qué pasa en cada caso</span>
          <h2>Tres envíos, tres desenlaces</h2>
          <p>Pruébalos en el escudo. El veredicto lo calcula el mismo detector que corre en tu navegador.</p>
        </div>

        <div
          ref={examples.ref}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: "16px",
            opacity: examples.visible ? 1 : 0,
            transform: examples.visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s",
          }}
        >
          {RISK_EXAMPLES.map((card) => (
            <article key={card.tier} className="card-flush" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Icon name={card.icon} size={16} style={{ color: card.color, flexShrink: 0 }} />
                <strong style={{ fontSize: "13.5px", color: "var(--upguard-text-headings)" }}>{card.label}</strong>
                <span
                  className="mono"
                  style={{ marginLeft: "auto", fontSize: "10px", color: card.color, letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  {card.grade}
                </span>
              </div>

              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--upguard-text-body)",
                  lineHeight: 1.55,
                  margin: "0 0 16px",
                  paddingLeft: "10px",
                  borderLeft: `2px solid ${card.color}`,
                }}
              >
                {card.example}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name={card.outcomeIcon} size={13} style={{ color: card.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: card.color }}>{card.outcomeLabel}</span>
              </div>
            </article>
          ))}
        </div>

        <button className="btn-secondary" style={{ marginTop: "24px" }} onClick={onStart}>
          <Icon name="shield" size={15} />
          <span>Abrir el escudo de envíos</span>
        </button>
      </section>
    </div>
  );
}
