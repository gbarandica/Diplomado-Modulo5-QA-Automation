/* Utilidades compartidas del front de la Tienda.
   El carrito vive en localStorage (no hay login ni backend de carrito):
   suficiente para los ejercicios E2E. */

// Debounce simple para no llamar la API en cada tecla.
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ── Carrito (localStorage) ───────────────────────────────────
const CARRITO_KEY = 'tienda-carrito';

function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CARRITO_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
  actualizarContadorCarrito();
}

function agregarAlCarrito(producto, cantidad) {
  const items = leerCarrito();
  const existente = items.find(i => i.id === producto.id);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    items.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
    });
  }
  guardarCarrito(items);
}

function quitarDelCarrito(id) {
  const items = leerCarrito().filter(i => i.id !== id);
  guardarCarrito(items);
}

function vaciarCarrito() {
  guardarCarrito([]);
}

function totalCarrito() {
  return leerCarrito().reduce((sum, i) => sum + i.precio * i.cantidad, 0);
}

function cantidadItemsCarrito() {
  return leerCarrito().reduce((sum, i) => sum + i.cantidad, 0);
}

// Actualiza el contador que se ve en la cabecera (todas las paginas lo tienen).
function actualizarContadorCarrito() {
  const contador = document.querySelector('[data-testid="carrito-contador"]');
  if (contador) contador.textContent = cantidadItemsCarrito();
}
