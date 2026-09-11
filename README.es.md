# Custos

**Español** · [English](./README.md)

[![▶ Video demo](https://img.shields.io/badge/%E2%96%B6%20Video%20demo-Ver%20en%20YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/3LAOwk1f-Oo)
[![Demo en vivo](https://img.shields.io/badge/Demo%20en%20vivo-custos--one--sand.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://custos-one-sand.vercel.app)
[![Red](https://img.shields.io/badge/Red-Tron%20Nile%20testnet-38BDF8?style=for-the-badge)](https://nile.tronscan.org)

**Escudo anti estafa on device para envíos de USDT.** Antes de que una
transferencia se firme, Custos analiza la dirección de destino y el chat del
estafador enteramente en el dispositivo del usuario. Ni el chat, ni la
dirección, ni las capturas salen del navegador. Según lo que encuentra, permite
firmar, exige una confirmación explícita o directamente no prepara ninguna
transacción.

Construido para el [Decentralized AI Hackathon](https://www.trydojo.io/hackathons/decentralized-ai-hackathon)
(ISD Summit, Panamá, 9 a 11 de septiembre de 2026).

## Demo

| | |
|---|---|
| **▶ Video demo** | **https://youtu.be/3LAOwk1f-Oo** |
| **🌐 Demo en vivo** | **https://custos-one-sand.vercel.app** |

[<img src="https://img.youtube.com/vi/3LAOwk1f-Oo/maxresdefault.jpg" alt="Ver el video demo de Custos" width="640">](https://youtu.be/3LAOwk1f-Oo)

El demo corre sobre **Tron Nile testnet** y crea su propia wallet dentro del
navegador, así que no hay nada que instalar. Los envíos aprobados se firman y se
difunden de verdad, y devuelven un hash que puedes abrir en Tronscan. Para
firmar, la wallet necesita TRX de prueba (gas) y USDT de prueba: copia su
dirección desde la pestaña **Escudo** y fondéala en el
[faucet de Nile](https://nileex.io/join/getJoinPage).

## Por qué existe

El *pig butchering*, el phishing de drenaje de wallets y las estafas de soporte
falso mueven miles de millones en USDT cada año. Exchanges, wallets y PSPs
quieren proteger al usuario, pero no pueden desplegar un detector de fraude en
la nube: el contexto del chat y la intención de la transacción son justo el tipo
de dato sensible que ningún equipo de cumplimiento deja salir del dispositivo. Y
una lista negra centralizada es un punto único de fallo y de censura.

Además, muchas de estas estafas se ejecutan con guiones traducidos de un idioma
a otro. Una víctima hispanohablante leyendo un guion copiado de un manual en
inglés o en chino es exactamente el caso donde la detección monolingüe falla en
silencio. Por eso el detector lleva las frases en los dos idiomas y las compara
sin distinguir acentos.

## Cómo funciona

Este es el flujo que ejecuta de verdad la versión web desplegada:

1. Pegas la dirección de destino, el monto y, si lo tienes, el mensaje del
   estafador.
2. Todo se analiza **dentro del navegador**. Corren tres señales independientes:
   coincidencia de frases sobre 12 familias de fraude (195 frases, español e
   inglés, sin distinguir acentos), comprobación de address poisoning contra tu
   historial de envíos, y consulta al directorio local de direcciones
   reportadas.
3. La señal más fuerte fija el nivel de riesgo (ver la tabla).
4. Si el envío no queda bloqueado, la transferencia se cotiza contra un nodo de
   Tron con una llamada constante. Eso lee el costo real de energía y **no firma
   nada**.
5. El nivel de riesgo decide la fricción: permitir, exigir confirmación
   explícita, o no preparar ninguna transacción.
6. Al confirmar, la transferencia se firma en el navegador y se difunde en Tron
   Nile, devolviendo un hash que puedes abrir en Tronscan.
7. La evaluación y la decisión quedan en un registro de auditoría local. El
   texto del chat nunca.

### Cómo se calcula el riesgo

Las señales son independientes y manda la más fuerte, así que cualquiera de
ellas puede elevar el nivel por sí sola.

| Señal | Confianza | Nivel resultante | Qué hace la app |
|---|---|---|---|
| Dirección ya reportada | forzado | **Crítico** | No se prepara ninguna transacción. No hay nada que firmar. |
| Address poisoning (mismos 6 primeros y 6 últimos caracteres que un destinatario previo) | 0.90 | **Crítico** | Mismo bloqueo duro. |
| Frase de estafa encontrada en el chat | 0.60 | **Alto** | Muestra la frase exacta que coincidió y exige confirmación explícita. |
| Nada coincidió | 0 | **Sin riesgo** | La firma procede sin fricción. |

Umbrales: `>= 0.85` crítico, `>= 0.6` alto, `>= 0.35` elevado, por debajo bajo o
sin riesgo. El bloqueo duro se aplica por partida doble: el botón de continuar
nunca se renderiza, y `RecordUserDecision` lanza un error si una evaluación
crítica se resuelve con algo distinto de `cancelled`.

## Compruébalo tú mismo

Todo lo de abajo se verifica en un navegador en unos dos minutos.

1. Abre el [demo en vivo](https://custos-one-sand.vercel.app) y ve a **Escudo**.
   La dirección de la wallet y los saldos se leen en vivo de un nodo de Tron
   Nile. No se instala nada ni hace falta ninguna extensión.
2. Abre **Casos de prueba**, carga *Pago normal a billetera verificada* y
   ejecuta el análisis. Sale limpio, la transferencia se firma y se difunde, y
   obtienes un hash. Ábrelo en Tronscan: la transacción existe en la cadena.
3. Carga *Mentor de inversiones y falso retiro*. El veredicto es riesgo alto y
   la app muestra la frase exacta que lo disparó con su confianza. El botón de
   envío ya exige una confirmación explícita.
4. Ve a **Reportes**, reporta esa dirección con un motivo, y vuelve a
   analizarla en **Escudo**. Ahora es crítica y no se prepara ninguna
   transacción.
5. Abre **VisionPsy** y sube una captura de un chat. El texto y cualquier
   dirección se extraen en un Web Worker de tu propia máquina.

Para firmar en el paso 2, la wallet de demo necesita TRX de prueba para gas y
USDT de prueba. Copia su dirección desde **Escudo** y fondéala en el
[faucet de Nile](https://nileex.io/join/getJoinPage).

## Arquitectura y tecnologías

El núcleo es hexagonal: `packages/core` contiene el dominio y los casos de uso y
no importa ningún SDK. Todo lo de abajo es un adaptador detrás de un puerto, y
por eso el mismo núcleo corre sin cambios en navegador, sobre Bare o sobre Node.

| Pieza | Tecnología | Estado en la build web desplegada |
|---|---|---|
| Detección de estafas | Dataset de frases detrás de `ScamDetectionPort` | **Funcionando.** 12 familias, 195 frases, español e inglés, sin distinguir acentos. |
| Pasada de LLM on device | **QVAC SDK** (`@qvac/sdk`) | Adaptador escrito, inactivo en navegador: `@qvac/sdk` no puede cargarse en un bundle de Vite. Corre sobre Bare o Node. |
| Detección multilingüe | **TranslatePsy** (QVAC Psy) | Adaptador escrito, misma restricción. La build web lo compensa llevando la lista de frases en los dos idiomas. |
| OCR de capturas | **tesseract.js** detrás de `OcrPort` | **Funcionando.** Corre en un Web Worker; la imagen no sale del navegador. |
| Wallet y liquidación | **tronweb** detrás de `WalletPort` | **Funcionando.** Transferencias reales de USDT TRC-20 en Tron Nile testnet, con comisiones simuladas contra el nodo. Un adaptador de **WDK** (`adapters-wdk`) implementa el mismo puerto para Node. |
| Directorio de riesgo | `RiskListPort`, caché local | **Funcionando, solo local.** Cada reporte guarda el motivo por el que se hizo. |
| Sincronización P2P | **Pears Stack (Hyperswarm)** | Adaptador escrito, inactivo en navegador: el gossip necesita UDP/DHT sin restricciones, que el navegador no expone. Corre sobre Bare o Node. |
| Aplicación | TypeScript, Vite + React | Desplegada en Vercel. |

Ninguna llamada de inferencia de esta app se enruta a una API en la nube. Las
únicas peticiones de red que hace la build desplegada son a un nodo público de
Tron Nile, para leer saldos y difundir las transferencias que tú apruebas.

### Pruebas

79 pruebas automatizadas sobre el dominio y los adaptadores, incluidas
regresiones de los errores que importaban: que el texto de estafa en español se
detecte de verdad, que la coincidencia sobreviva a la falta de acentos, que una
dirección marcada conserve sus mayúsculas originales de base58, y que la
dirección del caso de address poisoning sea un parecido genuino.

```bash
pnpm test
```

## Estructura del repositorio

```
packages/
  core/             entidades de dominio y casos de uso, sin E/S ni SDKs
  adapters-qvac/    @qvac/sdk: detección de estafas, TranslatePsy, VisionPsy
  adapters-wdk/     integración de wallet con WDK (para Node)
  adapters-p2p/     directorio de riesgo y sincronización Hyperswarm
  adapters-storage/ registro de auditoría local (evaluaciones y decisiones)
  shared/           dataset semilla de patrones de estafa, tipos compartidos
apps/
  web/              interfaz del flujo de envío
    src/wallet/     wallet de demo en Tron Nile (tronweb)
    src/vision/     OCR real en el navegador (tesseract.js)
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para el desglose completo.

## Puesta en marcha

```bash
pnpm install
pnpm build          # compila los paquetes del workspace
pnpm dev:web        # levanta la app en http://localhost:5173
pnpm test           # 79 pruebas
```

Opcional: para que todas las visitas compartan una misma wallet ya fondeada,
define `VITE_TRON_DEMO_PRIVATE_KEY` con una clave de **Nile testnet**. Vite
inserta esa variable en el bundle del cliente, así que queda pública: úsala solo
con fondos de prueba sin valor. `assertTestnet` se niega a conectarse a hosts de
mainnet precisamente por eso. Ver [apps/web/.env.example](./apps/web/.env.example).

## Privacidad

No hay servidor de análisis, ni telemetría, ni cuentas. El historial de
decisiones vive en el almacenamiento local del navegador y se puede borrar desde
la pestaña Auditoría. El texto del chat nunca se guarda ni se transmite.

## Licencia

MIT, ver [LICENSE](./LICENSE).
