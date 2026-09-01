const fs = require('fs');
const path = require('path');

// Fuente única de verdad de cuántas recepciones hay y con qué PIN entra cada
// una. Tanto el servidor de sockets (para validar el PIN) como el módulo de
// turnos (para crear un puesto por recepción) leen de aquí, así que agregar o
// quitar recepciones es solo editar puestos.config.json y reiniciar.
const RUTA_CONFIG = path.join(__dirname, '../puestos.config.json');
const CONFIG_DEFAULT = { '1': { pin: '1111' }, '2': { pin: '2222' }, '3': { pin: '3333' } };

// El orden de las claves es el que ve el recepcionista en el selector, así que
// se ordena por número: Object.keys pondría "10" antes que "2" en cuanto las
// claves dejaran de ser enteros pequeños.
function ordenar(claves) {
  return claves.slice().sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'es');
  });
}

function cargar() {
  try {
    const cfg = JSON.parse(fs.readFileSync(RUTA_CONFIG, 'utf8'));
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg) || Object.keys(cfg).length === 0) {
      throw new Error('el archivo no define ninguna recepción');
    }
    for (const [clave, valor] of Object.entries(cfg)) {
      if (!valor || typeof valor.pin === 'undefined' || String(valor.pin) === '') {
        throw new Error(`la recepción "${clave}" no tiene PIN`);
      }
    }
    return cfg;
  } catch (error) {
    console.warn(`[puestos] No se pudo leer puestos.config.json (${error.message}), usando la configuración por defecto`);
    return CONFIG_DEFAULT;
  }
}

const CONFIG = cargar();
const CLAVES = ordenar(Object.keys(CONFIG));

console.log(`[puestos] ${CLAVES.length} recepciones configuradas: ${CLAVES.join(', ')}`);

module.exports = { CONFIG, CLAVES };
