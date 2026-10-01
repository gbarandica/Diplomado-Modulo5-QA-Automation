/**
 * Servidor de la app Tienda.
 *
 * Un solo proceso sirve dos cosas:
 *   1) El FRONT estatico (HTML/CSS/JS) desde /public
 *   2) La API REST bajo /api  (productos y pedidos)
 *
 * Se hace asi a proposito: un solo puerto, un solo contenedor, un solo
 * despliegue. Facil de correr en local y de subir a AWS o Docker.
 *
 * Arrancar:
 *   node servidor/server.js        (o: npm start)
 *   PORT=8080 node servidor/server.js
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, '..');
const RUTA_DB = path.join(RAIZ, 'datos', 'db.json');
const PUBLIC = path.join(RAIZ, 'public');
const PORT = process.env.PORT || 3000;

// ── Cargar datos ─────────────────────────────────────────────
// Si no existe db.json, avisamos con un mensaje claro (falta npm run generar).
function cargarDb() {
  if (!fs.existsSync(RUTA_DB)) {
    console.error('\n[ERROR] No existe datos/db.json.');
    console.error('        Genera los datos primero:  npm run generar\n');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(RUTA_DB, 'utf-8'));
}

let db = cargarDb();
// pedidos se guardan en memoria durante la ejecucion (POST agrega, GET lista).
let proximoPedidoId = db.pedidos.reduce((max, p) => Math.max(max, p.id), 0) + 1;

const app = express();
app.use(express.json());

// Log simple de cada request (util en clase para ver el trafico).
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString().slice(11, 19)}  ${req.method} ${req.url}`);
  next();
});

// ── API: salud ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'app-tienda', hora: new Date().toISOString() });
});

// ── API: productos ───────────────────────────────────────────
// GET /api/productos           -> lista (filtros: ?categoria= y ?q=)
// GET /api/productos/:id       -> uno
app.get('/api/productos', (req, res) => {
  let resultado = [...db.productos];
  const { categoria, q } = req.query;

  if (categoria) {
    resultado = resultado.filter(p => p.categoria === String(categoria).toLowerCase());
  }
  if (q) {
    const termino = String(q).toLowerCase();
    resultado = resultado.filter(p => p.nombre.toLowerCase().includes(termino));
  }
  res.json(resultado);
});

app.get('/api/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  const producto = db.productos.find(p => p.id === id);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado', id });
  }
  res.json(producto);
});

// ── API: pedidos ─────────────────────────────────────────────
// GET  /api/pedidos            -> lista
// POST /api/pedidos            -> crea { productoId, cliente, cantidad }
app.get('/api/pedidos', (_req, res) => {
  res.json(db.pedidos);
});

app.post('/api/pedidos', (req, res) => {
  const { productoId, cliente, cantidad } = req.body || {};

  // Validaciones de negocio (las mismas reglas que probaremos con tests).
  if (!productoId || !cliente || !cantidad) {
    return res.status(400).json({ error: 'Faltan campos: productoId, cliente, cantidad' });
  }
  const producto = db.productos.find(p => p.id === Number(productoId));
  if (!producto) {
    return res.status(404).json({ error: 'El producto no existe', productoId });
  }
  if (Number(cantidad) < 1) {
    return res.status(400).json({ error: 'La cantidad debe ser al menos 1' });
  }
  if (!producto.activo || producto.stock < Number(cantidad)) {
    return res.status(409).json({ error: 'Producto sin stock suficiente', stock: producto.stock });
  }

  const pedido = {
    id: proximoPedidoId++,
    productoId: Number(productoId),
    cliente: String(cliente).toLowerCase(),
    cantidad: Number(cantidad),
    estado: 'pendiente',
    fecha: new Date().toISOString().slice(0, 10),
  };
  db.pedidos.push(pedido);
  res.status(201).json(pedido);
});

// ── FRONT estatico ───────────────────────────────────────────
app.use(express.static(PUBLIC));

// Cualquier otra ruta que no sea /api sirve el index (front de una sola app).
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

// ── Arranque ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n===========================================');
  console.log('  App Tienda corriendo');
  console.log('  Front : http://localhost:' + PORT + '/');
  console.log('  API   : http://localhost:' + PORT + '/api/productos');
  console.log('  Salud : http://localhost:' + PORT + '/api/health');
  console.log('  Productos: ' + db.productos.length + '  Pedidos: ' + db.pedidos.length);
  console.log('===========================================\n');
});
