/* ProyectoFinalMolina — Simulador Ecommerce
   - Carga remota de datos (JSON local simulado)
   - HTML generado dinámicamente desde JS
   - Librerías externas: SweetAlert2 (UI modals) y dayjs (fechas)
   - Sin console.log en producción
*/

const state = {
  products: [],
  filtered: [],
  cart: loadCart(),
};

// -------------------- Modelos --------------------
class Product {
  constructor({id, name, description, price, category, stock, image, oldPrice}){
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category;
    this.stock = stock;
    this.image = image;
    this.oldPrice = oldPrice ?? null;
  }
}
class CartItem {
  constructor(product, qty=1){
    this.id = product.id;
    this.name = product.name;
    this.price = product.price;
    this.image = product.image;
    this.qty = qty;
  }
}
class Cart {
  constructor(items=[]){
    this.items = items;
  }
  add(product){
    const found = this.items.find(i => i.id === product.id);
    if(found){
      found.qty++;
    }else{
      this.items.push(new CartItem(product, 1));
    }
    this.persist();
  }
  remove(id){
    this.items = this.items.filter(i => i.id !== id);
    this.persist();
  }
  setQty(id, qty){
    const it = this.items.find(i => i.id === id);
    if(!it) return;
    it.qty = Math.max(1, qty);
    this.persist();
  }
  clear(){
    this.items = [];
    this.persist();
  }
  subtotal(){
    return this.items.reduce((acc,i)=> acc + i.qty * i.price, 0);
  }
  tax(){
    return this.subtotal() * 0.21;
  }
  total(){
    return this.subtotal() + this.tax();
  }
  count(){
    return this.items.reduce((acc,i)=> acc + i.qty, 0);
  }
  persist(){
    localStorage.setItem("neostore_cart", JSON.stringify(this.items));
  }
}

function loadCart(){
  try{
    const raw = localStorage.getItem("neostore_cart");
    if(!raw) return new Cart([]);
    const items = JSON.parse(raw).map(i => Object.assign(new CartItem({}, 1), i));
    return new Cart(items);
  }catch(_e){
    return new Cart([]);
  }
}

// -------------------- Utilidades --------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const money = (n) => `$${n.toFixed(0)}`;

function setStatus(msg){
  const s = $("#status");
  s.textContent = msg;
}

function fillCategories(products){
  const cats = ["all", ...new Set(products.map(p => p.category))];
  const sel = $("#category");
  sel.innerHTML = "";
  for(const c of cats){
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c === "all" ? "Todas las categorías" : c;
    sel.appendChild(opt);
  }
}

function applyFilters(){
  const q = $("#q").value.trim().toLowerCase();
  const cat = $("#category").value;
  const inStock = $("#inStockOnly").checked;
  const minP = parseFloat($("#minPrice").value || "0");
  const maxP = parseFloat($("#maxPrice").value || Number.POSITIVE_INFINITY);
  const sort = $("#sort").value;

  let res = [...state.products];

  if(q){
    res = res.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }
  if(cat !== "all"){
    res = res.filter(p => p.category === cat);
  }
  if(inStock){
    res = res.filter(p => p.stock > 0);
  }
  res = res.filter(p => p.price >= minP && p.price <= maxP);

  switch(sort){
    case "price-asc": res.sort((a,b)=> a.price - b.price); break;
    case "price-desc": res.sort((a,b)=> b.price - a.price); break;
    case "name-asc": res.sort((a,b)=> a.name.localeCompare(b.name)); break;
    case "name-desc": res.sort((a,b)=> b.name.localeCompare(a.name)); break;
    default: break;
  }

  state.filtered = res;
  renderGrid();
}

function renderGrid(){
  const grid = $("#grid");
  grid.innerHTML = "";
  if(!state.filtered.length){
    setStatus("No se encontraron productos para esos filtros.");
    return;
  }
  setStatus(`${state.filtered.length} producto(s) encontrados`);
  for(const p of state.filtered){
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover" />
      </div>
      <div class="body">
        <div class="row" style="margin-bottom:.4rem">
          <h3 class="title">${p.name}</h3>
          <span class="badge">${p.category}</span>
        </div>
        <p class="desc">${p.description}</p>
        <div class="row" style="margin:.4rem 0">
          <div class="price">
            ${money(p.price)}
            ${p.oldPrice ? `<span class="old">${money(p.oldPrice)}</span>` : ""}
          </div>
          <div>${p.stock>0 ? `<span class="badge">Stock: ${p.stock}</span>` : `<span class="badge" style="color:var(--danger)">Sin stock</span>`}</div>
        </div>
        <div class="row">
          <button class="btn primary" data-add="${p.id}" ${p.stock===0 ? "disabled" : ""}>Agregar</button>
          <button class="icon-btn" data-details="${p.id}">Detalles</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

function bindGridEvents(){
  $("#grid").addEventListener("click", (e)=>{
    const addId = e.target.getAttribute("data-add");
    if(addId){
      const prod = state.products.find(p => String(p.id) === String(addId));
      if(!prod) return;
      if(prod.stock <= 0){
        Swal.fire({icon:"error", title:"Sin stock", text:"Este producto no está disponible por ahora."});
        return;
      }
      state.cart.add(prod);
      $("#cartCount").textContent = state.cart.count();
      Swal.fire({icon:"success", title:"Agregado al carrito", text: prod.name, timer:1200, showConfirmButton:false});
    }
    const detId = e.target.getAttribute("data-details");
    if(detId){
      const prod = state.products.find(p => String(p.id) === String(detId));
      if(!prod) return;
      Swal.fire({
        title: prod.name,
        html: `<p style="opacity:.9">${prod.description}</p>
               <p><strong>${money(prod.price)}</strong> ${prod.oldPrice ? `<span class="old">${money(prod.oldPrice)}</span>`: ""}</p>
               <p>Categoría: <em>${prod.category}</em></p>
               <p>Stock: ${prod.stock>0 ? prod.stock : "Sin stock"}</p>`,
        imageUrl: prod.image,
        imageWidth: 320,
        confirmButtonText: "OK"
      });
    }
  });
}

// -------------------- Carrito (drawer) --------------------
function openCart(){ $("#cartDrawer").classList.add("open"); renderCart(); }
function closeCart(){ $("#cartDrawer").classList.remove("open"); }
function renderCart(){
  $("#cartCount").textContent = state.cart.count();
  const body = $("#cartItems");
  body.innerHTML = "";
  for(const it of state.cart.items){
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <img src="${it.image}" alt="${it.name}" />
      <div>
        <p class="name">${it.name}</p>
        <p style="opacity:.8">${money(it.price)}</p>
        <div class="qty">
          <button class="icon-btn" data-minus="${it.id}">−</button>
          <span>${it.qty}</span>
          <button class="icon-btn" data-plus="${it.id}">+</button>
          <button class="icon-btn" data-remove="${it.id}" title="Quitar">🗑</button>
        </div>
      </div>
      <div><strong>${money(it.price * it.qty)}</strong></div>
    `;
    body.appendChild(row);
  }
  $("#cartSubtotal").textContent = money(state.cart.subtotal());
  $("#cartTax").textContent = money(state.cart.tax());
  $("#cartTotal").textContent = money(state.cart.total());
}

function bindCartEvents(){
  $("#btnCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#clearCartBtn").addEventListener("click", () => {
    if(!state.cart.items.length){
      Swal.fire({icon:"info", title:"El carrito ya está vacío.", timer:1200, showConfirmButton:false});
      return;
    }
    Swal.fire({
      icon:"warning", title:"¿Vaciar carrito?", showCancelButton:true, confirmButtonText:"Sí, vaciar"
    }).then(res => {
      if(res.isConfirmed){
        state.cart.clear();
        renderCart();
        Swal.fire({icon:"success", title:"Carrito vaciado", timer:1000, showConfirmButton:false});
      }
    });
  });
  $("#cartItems").addEventListener("click", (e)=>{
    const plus = e.target.getAttribute("data-plus");
    const minus = e.target.getAttribute("data-minus");
    const rem = e.target.getAttribute("data-remove");
    if(plus){
      const it = state.cart.items.find(i => String(i.id) === String(plus));
      if(it){ it.qty++; state.cart.persist(); renderCart(); }
    }
    if(minus){
      const it = state.cart.items.find(i => String(i.id) === String(minus));
      if(it){ it.qty = Math.max(1, it.qty-1); state.cart.persist(); renderCart(); }
    }
    if(rem){
      state.cart.remove(Number(rem));
      renderCart();
    }
  });
  $("#checkoutBtn").addEventListener("click", ()=> {
    $("#checkoutForm").scrollIntoView({behavior:"smooth", block:"center"});
    closeCart();
    Swal.fire({icon:"info", title:"Completá el formulario de checkout", timer:1500, showConfirmButton:false});
  });
}

// -------------------- Checkout --------------------
function bindCheckout(){
  $("#checkoutForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    if(state.cart.items.length === 0){
      Swal.fire({icon:"error", title:"Tu carrito está vacío"});
      return;
    }
    const data = new FormData(e.currentTarget);
    const order = {
      id: "ORD-" + Math.random().toString(36).slice(2,8).toUpperCase(),
      at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      buyer: {
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        addr: data.get("addr")
      },
      items: state.cart.items.map(i => ({id:i.id, name:i.name, qty:i.qty, price:i.price})),
      totals: {subtotal: state.cart.subtotal(), tax: state.cart.tax(), total: state.cart.total()}
    };
    // Simula actualización de stock local
    for(const it of state.cart.items){
      const prod = state.products.find(p => p.id === it.id);
      if(prod) prod.stock = Math.max(0, prod.stock - it.qty);
    }
    localStorage.setItem("neostore_last_order", JSON.stringify(order));
    state.cart.clear();
    renderCart();
    renderGrid();

    Swal.fire({
      icon:"success",
      title:"¡Compra realizada!",
      html: `<p><strong>Orden:</strong> ${order.id}</p>
             <p><strong>Fecha:</strong> ${order.at}</p>
             <p><strong>Total:</strong> ${money(order.totals.total)}</p>
             <p>Recibirás un email de confirmación en <em>${order.buyer.email}</em>.</p>`
    });
  });
}

// -------------------- Datos --------------------
async function loadData(){
  try{
    setStatus("Cargando catálogo…");
    const res = await fetch("data/products.json");
    const raw = await res.json();
    state.products = raw.products.map(p => new Product(p));
    fillCategories(state.products);
    state.filtered = [...state.products];
    renderGrid();
  }catch(_e){
    setStatus("Error al cargar datos. Verifica la ruta data/products.json");
    Swal.fire({icon:"error", title:"No se pudieron cargar los productos."});
  }
}

// -------------------- Filtros --------------------
function bindFilters(){
  $("#applyFilters").addEventListener("click", applyFilters);
  $("#clearFilters").addEventListener("click", () => {
    $("#q").value = "";
    $("#category").value = "all";
    $("#inStockOnly").checked = false;
    $("#minPrice").value = "";
    $("#maxPrice").value = "";
    $("#sort").value = "featured";
    applyFilters();
  });
  $("#q").addEventListener("input", () => {
    // filtrado reactivo suave
    applyFilters();
  });
  $("#category").addEventListener("change", applyFilters);
  $("#sort").addEventListener("change", applyFilters);
}

// -------------------- Init --------------------
function init(){
  bindGridEvents();
  bindCartEvents();
  bindCheckout();
  bindFilters();
  loadData();
  $("#year").textContent = String(new Date().getFullYear());
  $("#cartCount").textContent = state.cart.count();
  // Accesibilidad: cerrar drawer al presionar ESC
  document.addEventListener("keyup", (e)=>{
    if(e.key === "Escape") closeCart();
  });
}

document.addEventListener("DOMContentLoaded", init);
