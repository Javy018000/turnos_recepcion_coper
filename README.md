# Sistema de Turnos – COPER

Sistema de gestión de turnos para recepción. Las personas sacan turno desde una tablet
en la sala de espera, **varios recepcionistas** controlan una cola compartida desde sus
PCs, y una pantalla TV muestra a qué recepción debe dirigirse cada persona.

Hoy hay **9 recepciones** configuradas. El número no está fijo en el código: sale de
`puestos.config.json` (ver *Recepciones y PIN* más abajo).

## Cómo funciona con varios recepcionistas

- Hay **una sola cola** (orden de llegada). Cada recepcionista la atiende desde su propio PC.
- Al abrir el panel de recepción, cada recepcionista **elige su puesto** (Recepción 1 a 9). La elección se recuerda en ese navegador.
- Cuando un recepcionista pulsa **"Llamar siguiente"**, el primer turno de la cola se le asigna a *su* puesto. Los demás puestos no se ven afectados.
- La **TV anuncia el destino**: muestra y dice por voz *"Turno Trámite de órdenes número 5, diríjase a Recepción 7"*, para que la persona sepa exactamente a dónde ir.

## Requisitos

- Node.js 18 o superior
- Red local (LAN/WiFi) — no requiere internet

## Instalación

```bash
npm install
```

## Cómo correr

**Producción:**
```bash
npm start
```

**Desarrollo (reinicio automático):**
```bash
npm run dev
```

El servidor muestra las tres URLs al iniciar:
```
✓ Servidor corriendo en http://localhost:3000
  Recepción: http://localhost:3000/recepcion
  Tablet:    http://localhost:3000/tablet
  TV:        http://localhost:3000/tv
```

## Encontrar la IP local del servidor

Cada dispositivo en la red debe ingresar la IP del PC servidor, no `localhost`.

**Windows:**
```cmd
ipconfig
```
Buscar "Dirección IPv4" bajo el adaptador de red activo (ej: `192.168.1.105`).

**Mac/Linux:**
```bash
ifconfig
```
Buscar `inet` bajo `en0` o `eth0`.

## Qué abrir en cada dispositivo

| Dispositivo | URL |
|---|---|
| PC de cada recepcionista (1 a 9) | `http://<IP-servidor>:3000/recepcion` |
| Tablet de la sala de espera | `http://<IP-servidor>:3000/tablet` |
| Samsung Smart TV | `http://<IP-servidor>:3000/tv` |

> Todos los PCs de recepción abren la **misma URL** `/recepcion`. La primera vez, cada uno elige su puesto e ingresa el PIN. Un puesto ya tomado por un equipo no puede ser usado por otro al mismo tiempo.

## Recepciones y PIN

`puestos.config.json` (en la raíz del proyecto) decide **cuántas recepciones hay** y con qué
PIN entra cada una. Es el único lugar donde se define: una entrada por recepción.

```json
{
  "1": { "pin": "1111" },
  "2": { "pin": "2222" },
  "3": { "pin": "3333" },
  "4": { "pin": "4444" },
  "5": { "pin": "5555" },
  "6": { "pin": "6666" },
  "7": { "pin": "7777" },
  "8": { "pin": "8888" },
  "9": { "pin": "9999" }
}
```

Para agregar o quitar recepciones, edita este archivo y reinicia el servidor. No hay que
tocar HTML ni CSS: los botones del selector y las tarjetas del panel se dibujan con lo que
diga la configuración. La clave puede ser cualquier texto (`"1"`, `"A"`, `"Caja 1"`); es lo
que se muestra como *"Recepción X"* y lo que anuncia la TV.

Al arrancar, el servidor ajusta `data/state.json` a la nueva configuración: crea vacías las
recepciones nuevas y conserva el turno activo de las que siguen existiendo. Si quitas una
recepción que tenía un turno en atención, ese turno **vuelve al inicio de la cola** en vez
de perderse (queda anotado en la consola).

**Cambia estos PINs antes de usar el sistema en producción.** El recepcionista ingresa el
PIN una sola vez por equipo; queda recordado en ese navegador. Para cambiar de puesto, toca
el chip "Recepción N" en el encabezado.

## Servicios

Actualmente hay cuatro:

| ID | Nombre visible |
|---|---|
| `tramite-ordenes` | Trámite de órdenes |
| `expediente-medico-laboral` | Expediente médico laboral |
| `entrega-ordenes` | Entrega de órdenes |
| `juridica` | Jurídica |

### Solo cambiar el texto que se ve

Si el nombre visible cambia pero el servicio es el mismo, se toca **una línea en cada uno de
estos tres archivos**, dejando el ID intacto:

- `public/tablet/index.html` → el `<span class="btn-label">` del botón
- `public/tablet/tablet.js`, `public/tv/tv.js`, `public/recepcion/recepcion.js` → el valor
  en `ETIQUETAS_SERVICIO`

Ejemplo: para que "Jurídica" pase a decir "Asesoría jurídica", se cambia el texto del botón
en el HTML y el valor `'juridica': 'Jurídica'` en las tres tablas. El ID `juridica` no se
toca, así que los turnos ya creados y sus contadores siguen funcionando.

### Agregar, quitar o renombrar el ID de un servicio

Si cambia el catálogo en sí, hay tres lugares y los IDs deben coincidir en todos:

| Archivo | Qué define |
|---|---|
| `server/turnos.js` → `SERVICIOS_VALIDOS` | El catálogo. Los contadores se derivan de esta lista |
| `public/tablet/index.html` → botones `.btn-servicio` | Botones e íconos de la tablet |
| `ETIQUETAS_SERVICIO` en `tablet.js`, `tv.js` y `recepcion.js` | Nombre visible de cada servicio |

Los botones de la tablet están en una cuadrícula 2×2, así que cuatro servicios es lo que
entra sin retocar el CSS.

El servidor tolera el cambio sin borrar nada: al arrancar, `normalizar()` crea un contador
en cero para cada servicio nuevo y descarta los de servicios que ya no existen, así que un
`data/state.json` viejo no rompe el arranque.

## Botones del panel de recepción

- **Llamar siguiente** — toma el primer turno de la cola y lo asigna a tu puesto.
- **Repetir** — vuelve a anunciar por voz en la TV el turno actual (si la persona no escuchó).
- **Atendido** — cierra el turno actual como atendido.
- **Ausente** — cierra el turno actual como ausente (la persona no se presentó).

Ejemplo: si la IP del servidor es `192.168.1.105`, la tablet abre `http://192.168.1.105:3000/tablet`.

## Configurar Samsung Smart TV

1. Abrir el navegador integrado del TV (Samsung Internet o similar)
2. Ingresar la URL: `http://<IP-servidor>:3000/tv`
3. El TV actualiza automáticamente con Socket.IO — no necesita recargar

## Modo kiosco en Android (tablet de la sala de espera)

1. Ir a **Ajustes → Accesibilidad → Pantalla anclada** (o "Fijar pantalla")
2. Activar la opción
3. Abrir Chrome con la URL de la tablet
4. Mantener presionado el botón de recientes y tocar el ícono de anclaje

## Modo kiosco en iPad (tablet de la sala de espera)

1. Ir a **Ajustes → Accesibilidad → Acceso guiado**
2. Activar "Acceso guiado"
3. Abrir Safari con la URL de la tablet
4. Hacer triple clic en el botón de inicio para iniciar el acceso guiado
5. Tocar "Iniciar"

## Marca

- Logo: `public/assets/logo.png` (escudo COPER, PNG con fondo transparente).
- El nombre visible está en el encabezado de las tres vistas: `public/*/index.html`.

La paleta sale del propio escudo: oro y negro son el 80% de sus píxeles. Los tokens están
en el `:root` de cada CSS:

| Token | Valor | Para qué |
|---|---|---|
| `--oro` | `#F7B101` | Color de marca. Fondos de botón, bordes, texto sobre negro |
| `--oro-hover` | `#C98F00` | Hover de los fondos en oro |
| `--oro-texto` | `#8A6A10` | Solo en `recepcion.css`: oro legible sobre fondo claro |
| `--oro-tinte` | `#FFFBF0` | Solo en `recepcion.css`: fondo de tarjeta seleccionada |
| `--peligro` | `#C41E1E` | Cancelar, error, sin conexión. No es color de marca |

Dos reglas que hay que respetar al tocar los colores:

1. **Sobre oro el texto va en negro, nunca en blanco.** Blanco sobre `#F7B101` da 1.87:1 de
   contraste (ilegible); negro da 10.6:1.
2. **Sobre fondo claro no se usa `--oro` como texto** (1.70:1). Para eso está `--oro-texto`,
   que da 5.06:1 sobre blanco.

## Datos persistentes

El estado se guarda en `data/state.json` automáticamente. Al reiniciar el servidor, la cola y los contadores se mantienen. El estado se reinicia automáticamente cada día (zona horaria: America/Bogota).
