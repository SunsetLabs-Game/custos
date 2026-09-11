import { Icon } from "../Icon.js";
import { NILE_FAUCET_URL, NILE_USDT_CONTRACT } from "../wallet/tronNetwork.js";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "34px" }}>
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--upguard-text-headings)",
          margin: "0 0 10px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <div style={{ fontSize: "13.5px", lineHeight: 1.65, color: "var(--upguard-text-body)" }}>{children}</div>
    </section>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "var(--upguard-text-headings)", fontWeight: 600 }}>{children}</strong>;
}

export function InfoTab({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ maxWidth: "720px" }}>
      <div className="section-head" style={{ marginBottom: "32px" }}>
        <span className="eyebrow">Información</span>
        <h2>Cómo funciona Custos</h2>
        <p>
          Qué hace exactamente, qué significa cada nivel de riesgo y qué partes son reales frente a
          qué partes están limitadas por correr dentro de un navegador.
        </p>
      </div>

      <Section title="El problema">
        <p style={{ margin: 0 }}>
          Una transferencia de USDT es irreversible. Cuando alguien cae en un fraude de{" "}
          <Term>pig butchering</Term>, soporte falso o recuperación de fondos, el dinero se pierde en
          el momento en que firma. Las alertas genéricas no ayudan porque llegan sin contexto: el
          contexto real está en la conversación con el estafador y en la dirección de destino, y ambos
          son datos demasiado sensibles como para mandarlos a un servidor ajeno.
        </p>
      </Section>

      <Section title="Qué hace Custos">
        <p style={{ margin: "0 0 10px" }}>
          Se coloca en el único punto donde todavía se puede evitar el daño: <Term>entre la intención
          de enviar y la firma</Term>. Antes de que exista una transacción, analiza la dirección de
          destino y el texto que pegues, y decide cuánta fricción imponer.
        </p>
        <p style={{ margin: 0 }}>
          Todo el análisis ocurre en tu navegador. El texto del chat, la dirección y las capturas de
          pantalla no se envían a ningún servidor: el detector de patrones, el OCR y la lista de
          direcciones reportadas viven en esta pestaña.
        </p>
      </Section>

      <Section title="Cómo se calcula el riesgo">
        <p style={{ margin: "0 0 12px" }}>
          Hay tres señales independientes, y la más fuerte manda. Cualquiera de ellas puede elevar el
          nivel por sí sola:
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: "18px" }}>
          <li style={{ marginBottom: "6px" }}>
            <Term>Patrones en el texto.</Term> El chat se compara contra frases de 12 familias de
            estafa conocidas, en español e inglés, sin distinguir acentos. Una coincidencia vale 0.6
            de confianza.
          </li>
          <li style={{ marginBottom: "6px" }}>
            <Term>Address poisoning.</Term> Si el destino comparte los 6 primeros y los 6 últimos
            caracteres con alguien a quien ya enviaste, pero difiere en el medio, se marca con 0.9.
          </li>
          <li>
            <Term>Directorio de reportes.</Term> Si la dirección ya fue reportada, el nivel salta
            directamente a crítico, sin importar el texto.
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          Esa confianza se traduce en el nivel final: <Term>0.85 o más</Term> es crítico,{" "}
          <Term>0.6</Term> es alto, <Term>0.35</Term> es elevado, y por debajo es bajo o sin riesgo.
        </p>
      </Section>

      <Section title="Qué significa cada nivel">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            {
              color: "var(--color-safe)",
              icon: "verified",
              name: "Sin riesgo / bajo",
              body: "Nada coincidió. La firma queda habilitada sin fricción y el envío procede normalmente.",
            },
            {
              color: "var(--color-elevated)",
              icon: "warning",
              name: "Elevado / alto",
              body: "Hay una coincidencia real. Se muestra la evidencia exacta que la disparó y el botón exige una confirmación explícita: puedes continuar, pero no por accidente.",
            },
            {
              color: "var(--color-critical)",
              icon: "block",
              name: "Crítico",
              body: "No se prepara ninguna transacción. No es un aviso que se pueda ignorar: sencillamente no hay nada que firmar.",
            },
          ].map((level) => (
            <div
              key={level.name}
              style={{
                display: "flex",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "var(--radius-input)",
                background: "var(--upguard-layer-strong)",
              }}
            >
              <Icon name={level.icon} size={16} style={{ color: level.color, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "13px", color: level.color, display: "block", marginBottom: "2px" }}>
                  {level.name}
                </strong>
                <span style={{ fontSize: "12.5px", lineHeight: 1.55 }}>{level.body}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Los reportes y por qué llevan una causa">
        <p style={{ margin: "0 0 10px" }}>
          Reportar una dirección es la señal más fuerte del sistema, así que cada reporte guarda{" "}
          <Term>por qué</Term> se hizo. Si viene de una evaluación, se guarda la categoría detectada y
          la frase exacta que la disparó; si lo haces a mano, eliges el motivo y puedes añadir un
          detalle.
        </p>
        <p style={{ margin: 0 }}>
          Sin esa causa, una lista de direcciones bloqueadas es imposible de auditar: no podrías
          distinguir un fraude verificado de un error tuyo de hace tres semanas, ni decidir si te
          fías del reporte de otro par.
        </p>
      </Section>

      <Section title="La wallet de prueba">
        <p style={{ margin: "0 0 10px" }}>
          Para que el bloqueo signifique algo tiene que haber una transacción real que bloquear. La
          app crea sola una wallet en <Term>Tron Nile testnet</Term> y la guarda en este navegador,
          sin instalar ninguna extensión. Los envíos que apruebes se firman y se difunden de
          verdad en esa red, y obtienes un hash que puedes abrir en el explorador.
        </p>
        <p style={{ margin: "0 0 10px" }}>
          Para firmar hacen falta dos cosas: <Term>TRX</Term> para pagar el gas y <Term>USDT</Term> de
          prueba para enviar. Ambos se piden gratis en el{" "}
          <a href={NILE_FAUCET_URL} target="_blank" rel="noreferrer" style={{ color: "var(--color-info)" }}>
            faucet de Nile ↗
          </a>
          , copiando la dirección desde la pestaña Escudo.
        </p>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--upguard-text-muted)" }}>
          Contrato USDT en Nile: <code className="mono">{NILE_USDT_CONTRACT}</code>. Son fondos de
          testnet sin valor real; la app se niega a conectarse a mainnet por diseño.
        </p>
      </Section>

      <Section title="Qué es real y qué está limitado">
        <p style={{ margin: "0 0 10px" }}>
          Vale la pena ser explícito, porque varias piezas suenan más grandes de lo que son dentro de
          un navegador:
        </p>
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          <li style={{ marginBottom: "6px" }}>
            <Term>Real:</Term> las transferencias USDT se firman y difunden en Tron Nile, la comisión
            se simula contra el nodo, el OCR corre de verdad en un Web Worker, y la detección de
            patrones y de address poisoning funcionan sobre tus datos.
          </li>
          <li style={{ marginBottom: "6px" }}>
            <Term>Limitado:</Term> la clasificación usa frases conocidas, no un modelo de lenguaje. El
            SDK de QVAC no puede cargarse en un bundle de navegador.
          </li>
          <li>
            <Term>Limitado:</Term> el directorio es solo tuyo. La sincronización por gossip de
            Hyperswarm necesita UDP/DHT sin restricciones, que el navegador no expone; el mismo
            adaptador sí sincroniza cuando la app corre sobre Bare o Node.
          </li>
        </ul>
      </Section>

      <Section title="Privacidad">
        <p style={{ margin: 0 }}>
          No hay servidor de análisis, ni telemetría, ni cuentas. El historial de decisiones vive en
          el almacenamiento local de este navegador y puedes borrarlo desde la pestaña Auditoría. Las
          únicas peticiones de red que hace la app son al nodo público de Tron Nile para leer saldos y
          difundir las transacciones que tú apruebes.
        </p>
      </Section>

      <button className="btn-upguard-primary" onClick={onStart}>
        <Icon name="shield" size={16} />
        <span>Probar el escudo</span>
      </button>
    </div>
  );
}
