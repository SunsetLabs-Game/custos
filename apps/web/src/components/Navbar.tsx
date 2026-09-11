import { useEffect, useState } from "react";

export type TabId = "landing" | "protector" | "vision" | "presets" | "audit" | "p2p" | "info";

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  auditCount: number;
}

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "protector", label: "Escudo", hint: "Verificar un envío antes de firmar" },
  { id: "vision", label: "VisionPsy", hint: "Leer una captura de pantalla" },
  { id: "presets", label: "Casos de prueba", hint: "Escenarios de estafa listos" },
  { id: "p2p", label: "Reportes", hint: "Direcciones marcadas como estafa" },
  { id: "audit", label: "Auditoría", hint: "Decisiones guardadas en este equipo" },
  { id: "info", label: "Info", hint: "Cómo funciona Custos" },
];

/** Custos = "guardian": a shield that has checked what is inside it. */
function Logo() {
  return (
    <svg width="21" height="23" viewBox="0 0 22 24" fill="none" aria-hidden="true">
      <path
        d="M11 1.2 L19.8 4.6 V12 C19.8 17.4 16 21.4 11 22.8 C6 21.4 2.2 17.4 2.2 12 V4.6 Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 11.9 L9.9 14.4 L14.6 9.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.4 L6.3 11.6 L13 4.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Navbar({ activeTab, onTabChange, auditCount }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on Escape and stop the page scrolling behind the panel.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const select = (tab: TabId) => {
    onTabChange(tab);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="upguard-navbar">
        <div className="nav-inner">
          <button className="nav-brand" onClick={() => select("landing")}>
            <span style={{ color: "var(--color-safe)", display: "flex" }}>
              <Logo />
            </span>
            <span
              style={{
                fontSize: "15.5px",
                fontWeight: 700,
                color: "var(--upguard-text-headings)",
                letterSpacing: "0.01em",
              }}
            >
              Custos
            </span>
          </button>

          {/* Wide screens: every option visible at once */}
          <nav className="nav-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
                {tab.id === "audit" && auditCount > 0 && (
                  <span className="mono" style={{ fontSize: "10px", color: "var(--upguard-text-muted)" }}>
                    {auditCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Phones: open the side panel instead of hiding options off-screen */}
          <button
            className="nav-burger"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Abrir menú de secciones"
          >
            <span className="nav-burger-label">
              {TABS.find((t) => t.id === activeTab)?.label ?? "Menú"}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="nav-scrim" onClick={() => setMenuOpen(false)} />
          <aside className="nav-drawer" role="menu" aria-label="Secciones">
            <div className="nav-drawer-head">
              <span className="eyebrow" style={{ margin: 0 }}>
                Secciones
              </span>
              <button className="nav-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <button
              className={`nav-drawer-item ${activeTab === "landing" ? "active" : ""}`}
              role="menuitemradio"
              aria-checked={activeTab === "landing"}
              onClick={() => select("landing")}
            >
              <span className="nav-drawer-mark">{activeTab === "landing" && <CheckMark />}</span>
              <span className="nav-drawer-text">
                <span className="nav-drawer-label">Inicio</span>
                <span className="nav-drawer-hint">Qué es Custos</span>
              </span>
            </button>

            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`nav-drawer-item ${activeTab === tab.id ? "active" : ""}`}
                role="menuitemradio"
                aria-checked={activeTab === tab.id}
                onClick={() => select(tab.id)}
              >
                <span className="nav-drawer-mark">{activeTab === tab.id && <CheckMark />}</span>
                <span className="nav-drawer-text">
                  <span className="nav-drawer-label">
                    {tab.label}
                    {tab.id === "audit" && auditCount > 0 && (
                      <span className="mono nav-drawer-count">{auditCount}</span>
                    )}
                  </span>
                  <span className="nav-drawer-hint">{tab.hint}</span>
                </span>
              </button>
            ))}
          </aside>
        </>
      )}
    </>
  );
}
