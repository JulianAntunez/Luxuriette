let productList = [];
let allProductsMaster = [];
let carrito = [];
let total = 0;
let currentPage = 1;
const itemsPerPage = 24;

// --- 1. FUNCIONES GLOBALES (ACCESIBLES DESDE EL HTML) ---

// Verificación de Edad
function verifyAge() {
    const modal = document.getElementById("age-verification-modal");
    if (!modal) return;

    localStorage.setItem("ageVerified", "true");

    // Animación de salida
    modal.style.transition = "opacity 0.5s ease, visibility 0.5s";
    modal.style.opacity = "0";
    modal.style.visibility = "hidden";

    setTimeout(() => {
        modal.style.display = "none";
    }, 500);
}

function rejectAge() {
    window.location.href = "https://www.google.com";
}

// Agregar al carrito
function add(productId, price) {
    const product = productList.find(p => p.Id === productId);
    if (product && product.Stock > 0) {
        product.Stock--;
        const existingProduct = carrito.find(item => item.id === productId);
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            carrito.push({
                id: productId,
                price: price,
                quantity: 1,
                nombre: product.Producto
            });
        }
        total += price;
        saveCart();
        updateCartDisplay();
    } else {
        window.alert("No hay suficiente stock para agregar este producto.");
    }
}

// Cambiar imagen carrusel
function changeImage(productId, direction) {
    const product = productList.find(p => p.Id === productId);
    const images = [product.Img1, product.Img2, product.Img3].filter(Boolean);
    const imgElement = document.getElementById(`image-${productId}`);
    let currentImageIndex = images.indexOf(imgElement.src);

    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % images.length;
    } else {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    }
    imgElement.src = images[currentImageIndex];
}

// Paginación
function changePage(page, event) {
    const totalPages = Math.ceil(productList.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    if (event) event.preventDefault();
    currentPage = page;
    displayProducts();
    const section = document.getElementById("page-content");
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// Resetear búsqueda
function resetSearch() {
    if (document.getElementById('search-input')) document.getElementById('search-input').value = "";
    if (document.getElementById('search-input-mobile')) document.getElementById('search-input-mobile').value = "";
    displayProducts();
}

// --- 2. LÓGICA INTERNA DEL CARRITO ---

function updateCartDisplay() {
    const totalArticulos = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const cartCountElement = document.querySelector(".cart-count");
    if (cartCountElement) {
        cartCountElement.textContent = totalArticulos;
        cartCountElement.style.display = totalArticulos > 0 ? "inline-block" : "none";
    }
    const checkoutElement = document.getElementById("checkout");
    if (checkoutElement) {
        checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
    }
    updateCartModal();
}

function updateCartModal() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';
    let totalModal = 0;

    carrito.forEach(item => {
        const product = allProductsMaster.find(p => p.Id == item.id);
        if (product) {
            const quantity = item.quantity || 1;
            const precio = parseFloat(product.Precio) || 0;
            const subtotal = quantity * precio;
            totalModal += subtotal;

            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#product-${product.Id}" class="item-name-link" style="text-decoration: none; color: inherit;">
                    <span class="item-name">${product.Producto}</span>
                </a>
                <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
                <button class="btn-remove-item" data-id="${item.id}">❌</button>
            `;

            li.querySelector('.item-name-link').onclick = () => {
                document.getElementById("cart-modal").style.display = "none";
            };

            li.querySelector('.btn-remove-item').onclick = function (e) {
                e.stopPropagation();
                remove(parseInt(this.getAttribute("data-id")));
            };
            cartItems.appendChild(li);
        }
    });
    cartTotal.textContent = `$${totalModal.toFixed(2)}`;
}

function remove(productId) {
    const index = carrito.findIndex(item => item.id === productId);
    if (index !== -1) {
        if (carrito[index].quantity > 1) {
            carrito[index].quantity--;
            total -= carrito[index].price;
        } else {
            total -= carrito[index].price;
            carrito.splice(index, 1);
        }
        saveCart();
        updateCartDisplay();
    }
}

function saveCart() { localStorage.setItem("cart", JSON.stringify(carrito)); }

function loadCart() {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        carrito = JSON.parse(savedCart);
        total = carrito.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        updateCartDisplay();
    }
}

// --- 3. PROCESAMIENTO DE PRODUCTOS Y BUSCADOR ---

async function fetchProducts(type) {
    try {
        if (allProductsMaster.length === 0) {
            const resAll = await fetch('/api/all-products');
            allProductsMaster = await resAll.json();
        }
        const resType = await fetch(`/api/products/${type}`);
        productList = (await resType.json()).filter(p => p.Stock > 0);
        displayProducts();
    } catch (error) { console.error('Error:', error); }
}

function displayProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    renderProducts(productList.slice(startIndex, startIndex + itemsPerPage));
    updatePagination();
}

function searchProducts() {
    const dInput = document.getElementById('search-input');
    const mInput = document.getElementById('search-input-mobile');
    const term = (dInput?.value || mInput?.value || "").toLowerCase().trim();

    if (term === "") { displayProducts(); return; }

    const filtered = productList.filter(p => 
        (p.Producto?.toLowerCase() || "").includes(term) || 
        (p.Descripcion?.toLowerCase() || "").includes(term)
    );

    if (filtered.length === 0) {
        document.getElementById("page-content").innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: white; padding: 50px;"><h3>No se encontró "${term}"</h3><button class="button-add" onclick="resetSearch()">Ver todos</button></div>`;
        document.getElementById("pagination").innerHTML = "";
    } else {
        renderProducts(filtered);
        document.getElementById("pagination").innerHTML = "";
    }
}
function toggleSearch() {
    const searchBar = document.getElementById("mobile-search-bar");
    if (searchBar) {
        // Si tiene la clase d-none (oculto), se la quitamos. Si no, se la ponemos.
        if (searchBar.classList.contains("d-none")) {
            searchBar.classList.remove("d-none");
            // Opcional: poner el foco automáticamente en el input
            document.getElementById("search-input-mobile")?.focus();
        } else {
            searchBar.classList.add("d-none");
        }
    }
}
function renderProducts(lista) {
    let html = '';
    lista.forEach(p => {
        const precio = parseFloat(p.Precio) || 0;
        html += `
            <div class="product-container" id="product-${p.Id}">
                <h3>${p.Producto || 'Sin nombre'}</h3>
                <div class="descr"><h4>${p.Descripcion || ''}</h4></div>
                <div class="carousel">
                    <div class="image-container">
                        <img src="${p.Img1 || ''}" alt="${p.Producto}" class="product-image" id="image-${p.Id}">
                        <div class="left-click-area" onclick="changeImage(${p.Id}, 'prev')"></div>
                        <div class="right-click-area" onclick="changeImage(${p.Id}, 'next')"></div>
                    </div>
                </div>
                <div class="product-footer">
                    <h1>$ ${precio.toFixed(2)}</h1>
                    <button class="button-add" onclick="add(${p.Id}, ${precio})">Agregar</button>
                </div>
            </div>`;
    });
    document.getElementById("page-content").innerHTML = html;
}

function updatePagination() {
    const totalPages = Math.ceil(productList.length / itemsPerPage);
    if (totalPages <= 1) { document.getElementById("pagination").innerHTML = ''; return; }
    let html = `<button class="page-link-custom" onclick="changePage(${currentPage - 1}, event)">&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-link-custom ${i === currentPage ? 'active' : ''}" onclick="changePage(${i}, event)">${i}</button>`;
    }
    html += `<button class="page-link-custom" onclick="changePage(${currentPage + 1}, event)">&raquo;</button>`;
    document.getElementById("pagination").innerHTML = html;
}

// --- 4. PAGO POR WHATSAPP ---

async function pay() {
    if (carrito.length === 0) return alert("Carrito vacío");
    const btn = document.getElementById("checkout-button");
    btn.disabled = true; btn.innerText = "Procesando...";

    try {
        const res = await fetch("/api/pay", { method: 'POST', body: JSON.stringify(carrito), headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Error");

        const lista = carrito.map(i => `- (${i.id}) ${i.nombre} x${i.quantity}`).join('%0A');
        const mensaje = `¡Hola *Luxuriette*! Pedido: ${result.idVenta}%0A*Detalle:*%0A${lista}%0A*Total:* $${result.total.toFixed(2)}%0A_Coordinemos el envío._`;
        
        window.open(`https://wa.me/5493757677266?text=${mensaje}`, '_blank');
        carrito = []; total = 0; saveCart(); updateCartDisplay();
        document.getElementById("cart-modal").style.display = "none";
        location.reload(); 
    } catch (e) { alert(e.message); } finally { btn.disabled = false; btn.innerText = "Pagar"; }
}

// --- 5. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de Edad
    const ageModal = document.getElementById("age-verification-modal");
    if (localStorage.getItem("ageVerified") === "true") {
        if (ageModal) ageModal.style.display = "none";
    } else {
        if (ageModal) ageModal.style.display = "flex";
    }

    document.getElementById("btn-age-yes")?.addEventListener("click", verifyAge);
    document.getElementById("btn-age-no")?.addEventListener("click", rejectAge);

    // 2. Carga Dinámica de Productos
    const container = document.getElementById("page-content");
    if (container) {
        let type = 1; 
        const path = location.pathname.toLowerCase(); // Convertimos a minúsculas para evitar errores
        
        if (path.includes('juguetes')) type = 2;
        else if (path.includes('ropa')) type = 3;
        else if (path.includes('ofertas')) type = 4; // Agregué ofertas por si acaso
        
        fetchProducts(type);
    }

    // 3. Inicializar Carrito y Buscadores
    loadCart();

    document.getElementById('search-input')?.addEventListener('input', searchProducts);
    document.getElementById('search-input-mobile')?.addEventListener('input', searchProducts);
    
    // Vinculamos el botón de pago
    document.getElementById("checkout-button")?.addEventListener("click", pay);

    // 4. Lógica de Apertura del Carrito
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
        cartIcon.onclick = (e) => {
            e.stopPropagation();
            const modal = document.getElementById("cart-modal");
            if (modal) {
                modal.style.display = "block";
                updateCartModal();
            }
        };
    }
});

// 5. FUNCIÓN PARA CERRAR EL MODAL (Agrégala fuera del DOMContentLoaded)
function closeModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.style.display = "none";
}