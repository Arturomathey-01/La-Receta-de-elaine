// ============================================
//   La Receta De Elaine — script.js
// ============================================
const { escucharPostresDia, agregarPostreDia, eliminarPostreDia, descontarStock, guardarPedido } = window.firebaseFunctions || {};
const PRODUCTS = [
  {
    id: 1,
    name: "Flan Napolitano",
    desc: "Cucharada dulce del cielo con sabor a hogar",
    type: "slice-whole",
    priceSlice: 40,
    priceWhole: 290,
    img: "IMAGENES/Flan napolitano.jpeg"
  },
  {
    id: 2,
    name: "Choco - Flan",
    desc: "El imposible que se hace realidad en tu boca con doble sabor y doble felicidad",
    type: "slice-whole",
    priceSlice: 50,
    priceWhole: 350,
    img: "IMAGENES/Choco_Flan.jpeg"
  },
  {
    id: 3,
    name: "Pay de queso crema",
    desc: "No es cualquier pay es nuestra receta especial hecha a mano, con el corazon y mucho queso crema",
    type: "slice-whole",
    priceSlice: 40,
    priceWhole: 320,
    img: "IMAGENES/Pay de queso.jpeg"
  },
  {
    id: 4,
    name: "Cheesecake",
    desc: "No es solo un postre, es una experiencia nueva para tu paladar",
    type: "slice-whole",
    priceSlice: 60,
    priceWhole: 500,
    img: "IMAGENES/Chessecake.jpeg"
  },
  {
    id: 5,
    name: "Gelatina de mosaico",
    desc: "Pequeños cubos de alegria, un gran sabor artesanal que hace que en tu boca sepa mejor a lo que tus ojos pueden ver",
    type: "gelatin",
    options: [
      { key: "grande",  label: "Grande",  price: 400 },
      { key: "mediano", label: "Mediano", price: 320 },
      { key: "chico",   label: "Chico",   price: 250 },
      { key: "domo",    label: "Domo",    price: 50  }
    ],
    imgNormal: "IMAGENES/Gelatina.jpeg",
    imgDomo:   "IMAGENES/Domo_gelatina.jpeg"
  },
  {
    id: 6,
    name: "Carlota-Limon con durazno y nuez",
    desc: "Refrescante carlota artesanal y tambien en presentación domo, con su toque único que la hace irresistible",
    type: "dome-only",
    priceDome:  60,
    priceWhole: 320,
    imgDomo:   "IMAGENES/Domo_Carlota.jpeg",
    imgWhole:  "IMAGENES/Carlota.jpeg"
  },
  {
    id: 7,
    name: "Chamoyadas",
    desc: "Refrescante chamoyada artesanal, perfecta para el calor con un toque irresistible de chamoy",
    type: "custom-two",
    labelA: "Jamaica", priceA: 13,
    labelB: "Fresa",   priceB: 15,
    img: "IMAGENES/Chamoyadas.jpeg"
  }
];

/* ---------- Estado ---------- */
let cart = [];
let orderCounter = 1;

/* ---------- DOM ---------- */
const productsGrid  = document.getElementById("productsGrid");
const cartOverlay   = document.getElementById("cartOverlay");
const cartSidebar   = document.getElementById("cartSidebar");
const cartItemsEl   = document.getElementById("cartItems");
const cartCountEl   = document.getElementById("cartCount");
const totalAmountEl = document.getElementById("totalAmount");
const toastEl       = document.getElementById("toast");
const navMenu       = document.getElementById("navMenu");

/* ============================================
   HELPERS — selectores por tipo
   ============================================ */
function selectorSliceWhole(p) {
  return `
    <div class="price-selector">
      <button class="price-tab active" onclick="selectSliceWhole(this,${p.id},'slice')">🍰 Rebanada</button>
      <button class="price-tab"       onclick="selectSliceWhole(this,${p.id},'whole')">🎂 Entero</button>
    </div>
    <div class="product-footer">
      <span class="price" id="price-${p.id}">$${p.priceSlice}</span>
      <button class="btn-add" onclick="addToCart(${p.id})">🛒 Agregar</button>
    </div>`;
}

function selectorGelatin(p) {
  const first = p.options[0];
  const tabs = p.options.map((o, i) => `
    <button class="price-tab ${i===0?'active':''}" onclick="selectGelatin(this,${p.id},'${o.key}')">
      ${o.key === 'domo' ? '🍮' : '🍰'} ${o.label}
    </button>`).join("");
  return `
    <div class="price-selector gelatin-selector">${tabs}</div>
    <div class="product-footer">
      <span class="price" id="price-${p.id}">$${first.price}</span>
      <button class="btn-add" onclick="addToCart(${p.id})">🛒 Agregar</button>
    </div>`;
}

function selectorCustomTwo(p) {
  return `
    <div class="price-selector">
      <button class="price-tab active" onclick="selectCustomTwo(this,${p.id},'A')">🥤 ${p.labelA}</button>
      <button class="price-tab"       onclick="selectCustomTwo(this,${p.id},'B')">🍓 ${p.labelB}</button>
    </div>
    <div class="product-footer">
      <span class="price" id="price-${p.id}">$${p.priceA}</span>
      <button class="btn-add" onclick="addToCart(${p.id})">🛒 Agregar</button>
    </div>`;
}

function selectorDomeOnly(p) {
  return `
    <div class="price-selector">
      <button class="price-tab active" onclick="selectDomeOnly(this,${p.id},'dome')">🍮 Domo</button>
      <button class="price-tab"       onclick="selectDomeOnly(this,${p.id},'whole')">🎂 Entero</button>
    </div>
    <div class="product-footer">
      <span class="price" id="price-${p.id}">$${p.priceDome}</span>
      <button class="btn-add" onclick="addToCart(${p.id})">🛒 Agregar</button>
    </div>`;
}

/* ============================================
   RENDERIZAR PRODUCTOS
   ============================================ */
function renderProducts() {
  productsGrid.innerHTML = PRODUCTS.map(p => {
    const initImg = p.type === "gelatin"     ? p.imgNormal
                  : p.type === "dome-only"   ? p.imgDomo
                  : p.type === "custom-two"  ? p.img
                  : p.img;
    const selector = p.type === "gelatin"    ? selectorGelatin(p)
                   : p.type === "dome-only"  ? selectorDomeOnly(p)
                   : p.type === "custom-two" ? selectorCustomTwo(p)
                   : selectorSliceWhole(p);
    return `
      <div class="product-card">
        <img id="img-${p.id}" src="${initImg}" alt="${p.name}" loading="lazy"
          onclick="openLightbox(document.getElementById('img-${p.id}').src, '${p.name}')" />
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          ${selector}
        </div>
      </div>`;
  }).join("");
}

/* ============================================
   FUNCIONES DE SELECCIÓN
   ============================================ */
function activateTab(btn) {
  btn.closest(".price-selector").querySelectorAll(".price-tab")
    .forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
}

function selectSliceWhole(btn, id, mode) {
  activateTab(btn);
  const p = PRODUCTS.find(x => x.id === id);
  p._selectedMode = mode;
  document.getElementById(`price-${id}`).textContent =
    mode === "slice" ? `$${p.priceSlice}` : `$${p.priceWhole}`;
}

function fadeImg(id, newSrc) {
  const el = document.getElementById(`img-${id}`);
  el.classList.add("changing");
  setTimeout(() => { el.src = newSrc; el.classList.remove("changing"); }, 200);
}

function selectGelatin(btn, id, key) {
  activateTab(btn);
  const p = PRODUCTS.find(x => x.id === id);
  p._selectedMode = key;
  const opt = p.options.find(o => o.key === key);
  document.getElementById(`price-${id}`).textContent = `$${opt.price}`;
  fadeImg(id, key === "domo" ? p.imgDomo : p.imgNormal);
}

function selectCustomTwo(btn, id, option) {
  activateTab(btn);
  const p = PRODUCTS.find(x => x.id === id);
  p._selectedMode = option;
  document.getElementById(`price-${id}`).textContent =
    option === "A" ? `$${p.priceA}` : `$${p.priceB}`;
}

function selectDomeOnly(btn, id, mode) {
  activateTab(btn);
  const p = PRODUCTS.find(x => x.id === id);
  p._selectedMode = mode;
  document.getElementById(`price-${id}`).textContent =
    mode === "dome" ? `$${p.priceDome}` : `$${p.priceWhole}`;
  fadeImg(id, mode === "dome" ? p.imgDomo : p.imgWhole);
}

/* ============================================
   CARRITO — LÓGICA
   ============================================ */
function addToCart(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  let price, label, img;

  if (p.type === "slice-whole") {
    const mode = p._selectedMode || "slice";
    price = mode === "slice" ? p.priceSlice : p.priceWhole;
    label = mode === "slice" ? "Rebanada" : "Entero";
    img   = p.img;
  } else if (p.type === "gelatin") {
    const key = p._selectedMode || p.options[0].key;
    const opt = p.options.find(o => o.key === key);
    price = opt.price; label = opt.label;
    img   = key === "domo" ? p.imgDomo : p.imgNormal;
  } else if (p.type === "dome-only") {
    const mode = p._selectedMode || "dome";
    price = mode === "dome" ? p.priceDome : p.priceWhole;
    label = mode === "dome" ? "Domo" : "Entero";
    img   = mode === "dome" ? p.imgDomo : p.imgWhole;
  } else if (p.type === "custom-two") {
    const opt = p._selectedMode || "A";
    price = opt === "A" ? p.priceA : p.priceB;
    label = opt === "A" ? p.labelA : p.labelB;
    img   = p.img;
  }

  const cartId   = `${productId}-${label}`;
  const existing = cart.find(i => i.cartId === cartId);
  if (existing) existing.qty++;
  else cart.push({ cartId, id: productId, name: `${p.name} (${label})`, price, img, qty: 1 });

  updateCartUI();
  showToast(`¡${p.name} (${label}) agregado! 🎉`);
}

function removeFromCart(cartId) {
  cart = cart.filter(i => i.cartId !== cartId);
  updateCartUI();
}

function changeQty(cartId, delta) {
  const item = cart.find(i => i.cartId === cartId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(cartId);
  else updateCartUI();
}

function getTotal()      { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function getTotalItems() { return cart.reduce((s, i) => s + i.qty, 0); }

/* ============================================
   CARRITO — UI
   ============================================ */
function updateCartUI() {
  const count = getTotalItems();
  cartCountEl.textContent = count;
  cartCountEl.classList.toggle("show", count > 0);

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Tu carrito está vacío.<br>¡Agrega algunos postres!</p>
      </div>`;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" />
        <div class="ci-details">
          <div class="ci-name">${item.name}</div>
          <div class="ci-price">$${item.price.toFixed(2)}</div>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty('${item.cartId}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.cartId}',+1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.cartId}')" title="Eliminar">🗑️</button>
      </div>`).join("");
  }
  totalAmountEl.textContent = `$${getTotal().toFixed(2)}`;
}

function openCart() {
  cartOverlay.classList.add("open");
  cartSidebar.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  cartOverlay.classList.remove("open");
  cartSidebar.classList.remove("open");
  document.body.style.overflow = "";
}

/* ============================================
   TOAST
   ============================================ */
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
}

/* ============================================
   POSTRE DEL DÍA — múltiples + STOCK
   ============================================ */
let featuredList = [];
let featuredIdCounter = 100;

function renderFeaturedGrid() {
  const grid = document.getElementById("featuredGrid");
  if (featuredList.length === 0) {
    grid.innerHTML = `
      <div class="featured-empty">
        <p>🍰 Aún no hay postres del día.<br>¡Agrega el primero desde el panel!</p>
      </div>`;
    return;
  }
  grid.innerHTML = featuredList.map(f => {
    const agotado = f.stock !== null && f.stock <= 0;
    const stockBadge = f.stock !== null
      ? agotado
        ? `<span class="stock-badge agotado">❌ Agotado</span>`
        : `<span class="stock-badge">${f.stock} disponibles</span>`
      : "";
    return `
      <div class="product-card featured-card">
        <div class="featured-badge">✨ Postre del Día</div>
        ${stockBadge}
        <img src="${f.img}" alt="${f.name}" style="cursor:zoom-in;"
          onclick="openLightbox('${f.img}', '${f.name.replace(/'/g,"\\'")}')"/>
        <div class="product-info">
          <h3>${f.name}</h3>
          <p>${f.desc}</p>
          <div class="product-footer">
            <span class="price">$${Number(f.price).toFixed(2)}</span>
            <div style="display:flex;gap:0.5rem;align-items:center;">
              <button class="btn-add" onclick="addFeaturedToCart(${f.id})"
                ${agotado ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                ${agotado ? '❌ Agotado' : '🛒 Agregar'}
              </button>
              <button class="btn-delete-featured" onclick="deleteFeatured(${f.id})" title="Eliminar">🗑️</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
}

function addFeaturedProduct() {
  const name     = document.getElementById("adminName").value.trim();
  const desc     = document.getElementById("adminDesc").value.trim();
  const price    = parseFloat(document.getElementById("adminPrice").value);
  const stockVal = document.getElementById("adminStock").value.trim();
  const stock    = stockVal === "" ? null : parseInt(stockVal);
  const fileInput = document.getElementById("adminImg");

  if (!name || !price) { showToast("⚠️ Nombre y precio son obligatorios"); return; }

  const newItem = {
    id:    featuredIdCounter++,
    name,
    desc:  desc || "",
    price,
    stock,
    img:   "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700&q=80"
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      newItem.img = e.target.result;
      featuredList.push(newItem);
      renderFeaturedGrid();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    featuredList.push(newItem);
    renderFeaturedGrid();
  }

  showToast(`✅ ¡${name} agregado como Postre del Día!`);
  toggleAdmin();
  ["adminName","adminDesc","adminPrice","adminStock","adminImg"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

function deleteFeatured(id) {
  featuredList = featuredList.filter(f => f.id !== id);
  renderFeaturedGrid();
  showToast("🗑️ Postre del Día eliminado");
}

function addFeaturedToCart(id) {
  const f = featuredList.find(x => x.id === id);
  if (!f) return;
  if (f.stock !== null && f.stock <= 0) {
    showToast("❌ Este postre está agotado");
    return;
  }
  const cartId = `featured-${id}`;
  const existing = cart.find(i => i.cartId === cartId);
  if (existing) existing.qty++;
  else cart.push({ cartId, id, name: `${f.name} (Postre del Día)`, price: f.price, img: f.img, qty: 1, featuredId: id });
  updateCartUI();
  showToast(`¡${f.name} agregado al carrito! 🎉`);
}

let adminOpen = false;
// Click derecho secreto en título Postre del Día
document.addEventListener("DOMContentLoaded", function() {
  const titulo = document.querySelector("#postre-del-dia .section-header h2");
  if (titulo) {
    titulo.addEventListener("contextmenu", function(e) {
      e.preventDefault(); // evita el menú del navegador
      toggleAdmin();
    });
  }
});
function toggleAdmin() {
  adminOpen = !adminOpen;
  document.getElementById("adminForm").classList.toggle("open", adminOpen);
  document.getElementById("adminToggleText").textContent =
    adminOpen ? "Cerrar panel" : "Agregar Postre del Día";
}

/* ============================================
   CHECKOUT MODAL
   ============================================ */
let selectedPago    = "efectivo";
let selectedEntrega = "domicilio";

function checkout() {
  if (cart.length === 0) return;
  closeCart();

  document.getElementById("checkoutSummary").innerHTML = cart.map(i => `
    <div class="checkout-summary-item">
      <span>${i.name} x${i.qty}</span>
      <span>$${(i.price * i.qty).toFixed(2)}</span>
    </div>`).join("");
  document.getElementById("checkoutTotal").textContent = `$${getTotal().toFixed(2)}`;

  selectedPago    = "efectivo";
  selectedEntrega = "domicilio";
  document.getElementById("inputDireccion").value = "";
  document.getElementById("locationHint").textContent = "";
  selectPago("efectivo");
  selectEntrega("domicilio");

  document.getElementById("checkoutOverlay").classList.add("open");
  document.getElementById("checkoutModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCheckout() {
  document.getElementById("checkoutOverlay").classList.remove("open");
  document.getElementById("checkoutModal").classList.remove("open");
  document.body.style.overflow = "";
}

function selectPago(tipo) {
  selectedPago = tipo;
  document.getElementById("payEfectivo").classList.toggle("active", tipo === "efectivo");
  document.getElementById("payTransfer").classList.toggle("active", tipo === "transferencia");
  document.getElementById("transferInfo").classList.toggle("show", tipo === "transferencia");
}

function selectEntrega(tipo) {
  selectedEntrega = tipo;
  document.getElementById("entregaDomicilio").classList.toggle("active", tipo === "domicilio");
  document.getElementById("entregaRecoger").classList.toggle("active",   tipo === "recoger");
  document.getElementById("domicilioForm").classList.toggle("show", tipo === "domicilio");
  document.getElementById("recogerInfo").classList.toggle("show",   tipo === "recoger");
}

function pedirUbicacion() {
  const hint = document.getElementById("locationHint");
  hint.textContent = "📡 Obteniendo ubicación...";
  if (!navigator.geolocation) {
    hint.textContent = "⚠️ Tu navegador no soporta geolocalización.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const link = `https://maps.google.com/?q=${lat},${lng}`;
      document.getElementById("inputDireccion").value = link;
      hint.textContent = "✅ ¡Ubicación obtenida!";
    },
    () => { hint.textContent = "⚠️ No se pudo obtener. Escribe tu dirección."; }
  );
}
async function confirmarPedido() {
  const direccion = document.getElementById("inputDireccion").value.trim();
  if (selectedEntrega === "domicilio" && !direccion) {
    showToast("⚠️ Escribe tu dirección o comparte tu ubicación");
    return;
  }

  // Descontar stock solo al confirmar
  cart.forEach(item => {
    if (item.featuredId !== undefined) {
      const f = featuredList.find(x => x.id === item.featuredId);
      if (f && f.stock !== null) {
        f.stock = Math.max(0, f.stock - item.qty);
      }
    }
  });

  // Generar folio desde Firebase
  let folio;
  try {
    folio = await guardarPedido({
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: getTotal(),
      pago: selectedPago,
      entrega: selectedEntrega
    });
  } catch(err) {
    console.error("Error Firebase:", err);
    folio = String(orderCounter).padStart(4, "0");
    orderCounter++;
  }

  const fecha = new Date().toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const itemsTexto = cart.map(i =>
    `• ${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`
  ).join("%0A");

  const pagoTexto = selectedPago === "efectivo" ? "💵 Efectivo" : "🏦 Transferencia";
  const entregaTexto = selectedEntrega === "domicilio"
    ? `🏠 A domicilio%0A📍 ${encodeURIComponent(direccion)}`
    : "🏪 Recoger en tienda";

  const msg =
    `🍰 *Nuevo Pedido - La Receta de Elaine*%0A` +
    `🔖 Folio: *#${folio}*%0A` +
    `📅 ${fecha}%0A%0A` +
    `${itemsTexto}%0A%0A` +
    `💰 *Total: $${getTotal().toFixed(2)}*%0A%0A` +
    `💳 *Pago:* ${pagoTexto}%0A` +
    `🚚 *Entrega:* ${entregaTexto}`;

    const ticketData = {
    folio,
    fecha,
    items: [...cart],
    total: getTotal(),
    pago: pagoTexto,
    entrega: selectedEntrega === "domicilio" ? `A domicilio — ${direccion}` : "Recoger en tienda"
  };
  window.open(`https://wa.me/529222340075?text=${msg}`, "_blank");
  orderCounter++;
  cart = [];
  updateCartUI();
  renderFeaturedGrid();
  closeCheckout();
  mostrarTicket(ticketData);
}
/* ============================================/* 
   TICKET
   ============================================ */
function mostrarTicket(data) {
  const itemsHTML = data.items.map(i => `
    <div class="ticket-item">
      <span>${i.name} x${i.qty}</span>
      <span>$${(i.price * i.qty).toFixed(2)}</span>
    </div>`).join("");

  document.getElementById("ticketFolio").textContent   = `#${data.folio}`;
  document.getElementById("ticketFecha").textContent   = data.fecha;
  document.getElementById("ticketItems").innerHTML     = itemsHTML;
  document.getElementById("ticketTotal").textContent   = `$${data.total.toFixed(2)}`;
  document.getElementById("ticketPago").textContent    = data.pago;
  document.getElementById("ticketEntrega").textContent = data.entrega;

  document.getElementById("ticketOverlay").classList.add("open");
  document.getElementById("ticketModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeTicket() {
  document.getElementById("ticketOverlay").classList.remove("open");
  document.getElementById("ticketModal").classList.remove("open");
  document.body.style.overflow = "";
}

function generarImagenTicket() {
  const modal    = document.getElementById("ticketModal");
  const acciones = document.querySelector(".ticket-actions");
  acciones.style.display = "none";

  const clone = modal.cloneNode(true);
  clone.style.position        = "absolute";
  clone.style.top             = "0";
  clone.style.left            = "0";
  clone.style.width           = "380px";
  clone.style.maxHeight       = "none";
  clone.style.overflow        = "visible";
  clone.style.transform       = "none";
  clone.style.zIndex          = "-9999";
  clone.style.borderRadius    = "16px";
  clone.style.backgroundColor = "#ffffff";
  clone.style.padding         = "1.5rem";

  const accionesClone = clone.querySelector(".ticket-actions");
  if (accionesClone) accionesClone.remove();

  document.body.appendChild(clone);

  return html2canvas(clone, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    allowTaint: true,
    width:  clone.scrollWidth,
    height: clone.scrollHeight
  }).then(canvas => {
    document.body.removeChild(clone);
    acciones.style.display = "";
    return canvas;
  }).catch(err => {
    document.body.removeChild(clone);
    acciones.style.display = "";
    throw err;
  });
}

function compartirTicket() {
  const folio = document.getElementById("ticketFolio").textContent;
  showToast("⏳ Generando imagen...");

  generarImagenTicket().then(canvas => {
    canvas.toBlob(blob => {
      if (!blob) { showToast("⚠️ Error al generar imagen"); return; }
      const file = new File([blob], `ticket-${folio}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          title: `Pedido ${folio} - La Receta de Elaine`,
          files: [file]
        }).catch(err => console.log("Share cancelado:", err));
      } else {
        const a = document.createElement("a");
        a.download = `ticket-${folio}.png`;
        a.href = URL.createObjectURL(blob);
        a.click();
        showToast("📥 Imagen descargada");
      }
    }, "image/png");
  }).catch(err => {
    console.error("Error:", err);
    showToast("⚠️ Error: " + err.message);
  });
}

function guardarTicket() {
  const folio = document.getElementById("ticketFolio").textContent;
  showToast("⏳ Generando imagen...");

  generarImagenTicket().then(canvas => {
    const a = document.createElement("a");
    a.download = `ticket-${folio}.png`;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("💾 ¡Ticket guardado!");
  }).catch(err => {
    console.error("Error:", err);
    showToast("⚠️ Error: " + err.message);
  });
}
/* ============================================
   MENÚ MÓVIL
   ============================================ */
function toggleMenu() { navMenu.classList.toggle("open"); }
navMenu.querySelectorAll("a").forEach(l => l.addEventListener("click", () => navMenu.classList.remove("open")));

/* ============================================
   FORMULARIO DE CONTACTO
   ============================================ */
document.getElementById("contactForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const nombre  = this.querySelector('input[type="text"]').value;
  const mensaje = this.querySelector('textarea').value;
  const texto = `¡Hola! Me llamo *${nombre}*%0A%0A💬 ${mensaje}`;
  window.open(`https://wa.me/529222340075?text=${texto}`, "_blank");
  showToast("¡Redirigiendo a WhatsApp! 💬");
  this.reset();
});

/* ============================================
   LIGHTBOX
   ============================================ */
const lightboxEl = document.createElement("div");
lightboxEl.className = "lightbox";
lightboxEl.id = "lightbox";
lightboxEl.innerHTML = `
  <button class="lightbox-close" onclick="closeLightbox()" title="Cerrar">✕</button>
  <img class="lightbox-img" id="lightboxImg" src="" alt="" />
  <div class="lightbox-name" id="lightboxName"></div>
`;
document.body.appendChild(lightboxEl);

lightboxEl.addEventListener("click", function(e) {
  if (e.target === lightboxEl) closeLightbox();
});
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") { closeLightbox(); closeTicket(); }
});

function openLightbox(src, name) {
  document.getElementById("lightboxImg").src  = src;
  document.getElementById("lightboxImg").alt  = name;
  document.getElementById("lightboxName").textContent = name;
  lightboxEl.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightboxEl.classList.remove("open");
  document.body.style.overflow = "";
}

// Exponer funciones globalmente para que funcionen los onclick del HTML
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
window.openCart = openCart;
window.closeCart = closeCart;
window.checkout = checkout;
window.closeCheckout = closeCheckout;
window.selectPago = selectPago;
window.selectEntrega = selectEntrega;
window.pedirUbicacion = pedirUbicacion;
window.confirmarPedido = confirmarPedido;
window.closeTicket = closeTicket;
window.compartirTicket = compartirTicket;
window.guardarTicket = guardarTicket;
window.toggleMenu = toggleMenu;
window.toggleAdmin = toggleAdmin;
window.addFeaturedProduct = addFeaturedProduct;
window.deleteFeatured = deleteFeatured;
window.addFeaturedToCart = addFeaturedToCart;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.selectSliceWhole = selectSliceWhole;
window.selectGelatin = selectGelatin;
window.selectCustomTwo = selectCustomTwo;
window.selectDomeOnly = selectDomeOnly;

/* ============================================
   INIT
   ============================================ */
renderProducts();
updateCartUI();
// Escuchar postres del día en tiempo real
escucharPostresDia(lista => {
  featuredList = lista;
  renderFeaturedGrid();
});