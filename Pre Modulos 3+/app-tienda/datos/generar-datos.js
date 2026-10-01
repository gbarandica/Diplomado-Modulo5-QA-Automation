/**
 * Genera los datos de la tienda con Faker (igual filosofia que el Dia 1 y 2).
 *
 * Produce  datos/db.json  con el formato:
 *   { "productos": [...], "pedidos": [...] }
 *
 * Semilla FIJA (faker.seed) -> mismos datos en cada corrida. Esto es clave
 * para que las pruebas E2E de Playwright sean deterministas: el catalogo
 * siempre muestra los mismos productos, con los mismos nombres y precios.
 *
 * Ejecutar:
 *   node datos/generar-datos.js       (o: npm run generar)
 *
 * NOTA: db.json NO se versiona (esta en .gitignore). Se regenera con Faker.
 */
import { faker } from '@faker-js/faker';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rutaDb = path.join(__dirname, 'db.json');

faker.seed(2025);

const CATEGORIAS = ['electronica', 'muebles', 'hogar', 'ropa', 'deportes'];
const ESTADOS    = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

const CANT_PRODUCTOS = 12;
const CANT_PEDIDOS   = 6;

// Imagen de producto por categoria (placeholder estable, no requiere red externa
// para el layout: usamos un color de fondo por categoria en el front).
function crearProducto(id) {
  return {
    id,
    nombre: faker.commerce.productName(),
    categoria: faker.helpers.arrayElement(CATEGORIAS),
    descripcion: faker.commerce.productDescription(),
    precio: Number(faker.commerce.price({ min: 20, max: 2500, dec: 2 })),
    stock: faker.number.int({ min: 0, max: 80 }),
    activo: true,
  };
}

const productos = Array.from({ length: CANT_PRODUCTOS }, (_, i) => crearProducto(i + 1));

// Caso de borde a proposito: el ultimo producto queda inactivo y sin stock.
productos[productos.length - 1].activo = false;
productos[productos.length - 1].stock = 0;

function crearPedido(id) {
  return {
    id,
    productoId: faker.number.int({ min: 1, max: CANT_PRODUCTOS }),
    cliente: faker.internet.email().toLowerCase(),
    cantidad: faker.number.int({ min: 1, max: 5 }),
    estado: faker.helpers.arrayElement(ESTADOS),
    fecha: faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
  };
}

const pedidos = Array.from({ length: CANT_PEDIDOS }, (_, i) => crearPedido(i + 1));

const db = { productos, pedidos };
fs.mkdirSync(path.dirname(rutaDb), { recursive: true });
fs.writeFileSync(rutaDb, JSON.stringify(db, null, 2));

console.log('===== Generar datos de la tienda (Faker) =====');
console.log('Productos: ' + productos.length + '  |  Pedidos: ' + pedidos.length);
console.log('Escrito en datos/db.json');
console.log('Caso de borde: producto ' + productos.length + ' inactivo, stock 0.');
console.log('Ejemplo: ' + productos[0].nombre + ' (' + productos[0].categoria + ') $' + productos[0].precio);
console.log('==============================================');
