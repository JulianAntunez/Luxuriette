let productList = [];
let allProductsMaster = [];
let carrito = [];
let total = 0;
let currentPage = 1;
const itemsPerPage = 24;

// Agrega un producto al carrito
function add(productId, price) {
    const product = productList.find(p => p.Id === productId);
    if (product && product.Stock > 0) {
        product.Stock--;

        const existingProduct = carrito.find(item => item.id === productId);
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            // AGREGAMOS 'nombre' aquí para que el Excel de ventas sepa qué es
            carrito.push({
                id: productId,
                price: price,
                quantity: 1,
                nombre: product.Producto // <--- Línea clave
            });
        }

        total += price;
        saveCart();
        updateCartDisplay();
    } else {
        window.alert("No hay suficiente stock para agregar este producto.");
    }
}

// Función para actualizar la visualización del carrito
// function updateCartDisplay() {
//     const totalArticulos = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);
//     const cartCountElement = document.querySelector("#cart-icon .cart-count");

//     if (cartCountElement) {
//         cartCountElement.textContent = totalArticulos;
//         // Mostrar solo si hay más de 0 productos
//         cartCountElement.style.display = totalArticulos > 0 ? "inline-block" : "none";
//     }

//     const checkoutElement = document.getElementById("checkout");
//     if (checkoutElement) {
//         checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
//     }

//     // Actualiza contador del carrito
//     document.querySelector(".cart-count").textContent = carrito.length;

//     // Actualiza el modal del carrito
//     updateCartModal();
// }

function updateCartDisplay() {
    // 1. Calculamos la suma REAL de todas las cantidades
    const totalArticulos = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // 2. Buscamos el elemento del círculo rojo (badge)
    const cartCountElement = document.querySelector(".cart-count");

    if (cartCountElement) {
        // 3. Asignamos el total real (ej: si hay 2 productos iguales, mostrará 2)
        cartCountElement.textContent = totalArticulos;

        // 4. Lo ocultamos si el carrito está vacío
        cartCountElement.style.display = totalArticulos > 0 ? "inline-block" : "none";
    }

    // Actualizar el total en dinero si existe el elemento checkout
    const checkoutElement = document.getElementById("checkout");
    if (checkoutElement) {
        checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
    }

    // IMPORTANTE: Elimina o comenta esta línea que tenías al final, 
    // ya que sobreescribía el valor correcto con la cantidad de filas:
    // document.querySelector(".cart-count").textContent = carrito.length; 

    // Actualiza el modal del carrito
    updateCartModal();
}
// --- FUNCIONES DE ACTUALIZACIÓN DEL MODAL ---
// function updateCartModal() {
//     const cartItems = document.getElementById("cart-items");
//     const cartTotal = document.getElementById("cart-total");
//     if (!cartItems || !cartTotal) return;

//     cartItems.innerHTML = '';
//     let totalModal = 0;

//     carrito.forEach(item => {
//         const product = allProductsMaster.find(p => p.Id == item.id);

//         if (product) {
//             const quantity = item.quantity || 1;
//             const precio = parseFloat(product.Precio) || 0;
//             const subtotal = quantity * precio;
//             totalModal += subtotal;

//             // const li = document.createElement('li');
//             // li.innerHTML = `
//             //     <span class="item-name">${product.Producto}</span>
//             //     <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
//             //     <button class="btn-remove-item" data-id="${item.id}">❌</button>
//             // `;
//             const li = document.createElement('li');
// li.innerHTML = `
//     <a href="#product-${product.Id}" class="item-name-link" style="text-decoration: none; color: inherit;">
//         <span class="item-name">${product.Producto}</span>
//     </a>
//     <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
//     <button class="btn-remove-item" data-id="${item.id}">❌</button>
// `;
//             cartItems.appendChild(li);
//         }
//     });

//     // Añadimos el evento para cerrar el modal al hacer clic en el nombre
// const link = li.querySelector('.item-name-link');
// link.onclick = () => {
//     document.getElementById("cart-modal").style.display = "none";
// };

// cartItems.appendChild(li);

//     // Manejador de clics para eliminar SIN cerrar el modal
//     const removeButtons = document.querySelectorAll(".btn-remove-item");
//     removeButtons.forEach(button => {
//         button.onclick = function (event) {
//             event.stopPropagation(); // Evita que el clic cierre el carrito
//             const productId = parseInt(this.getAttribute("data-id"));
//             remove(productId);
//         };
//     });

//     cartTotal.textContent = `$${totalModal.toFixed(2)}`;
// }

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

            // --- 1. AQUÍ SE DEFINE 'li' ---
            const li = document.createElement('li');

            // --- 2. SE ASIGNA EL CONTENIDO ---
            li.innerHTML = `
                <a href="#product-${product.Id}" class="item-name-link" style="text-decoration: none; color: inherit;">
                    <span class="item-name">${product.Producto}</span>
                </a>
                <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
                <button class="btn-remove-item" data-id="${item.id}">❌</button>
            `;

            // --- 3. CONFIGURAR EVENTO DEL LINK (Dentro del ámbito de 'li') ---
            const link = li.querySelector('.item-name-link');
            if (link) {
                link.onclick = () => {
                    document.getElementById("cart-modal").style.display = "none";
                };
            }

            // --- 4. CONFIGURAR EVENTO DEL BOTÓN ELIMINAR ---
            const btnRemove = li.querySelector('.btn-remove-item');
            if (btnRemove) {
                btnRemove.onclick = function (event) {
                    event.stopPropagation();
                    const productId = parseInt(this.getAttribute("data-id"));
                    remove(productId);
                };
            }

            // --- 5. AÑADIR AL CONTENEDOR ---
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
            total -= carrito[index].price * carrito[index].quantity;
            carrito.splice(index, 1);
        }

        saveCart();
        updateCartDisplay();
        // Al llamar a updateCartModal aquí, el modal se refresca pero NO se oculta
        updateCartModal();
    }
}
// Guardar el carrito en el almacenamiento local
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(carrito));
}

// Cargar el carrito desde el almacenamiento local
function loadCart() {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        carrito = JSON.parse(savedCart);
        total = 0; // REINICIAR TOTAL antes de recalcular
        carrito.forEach(item => {
            total += item.price * item.quantity;
        });
        updateCartDisplay();
    }
}

// Procesa el pago
async function pay() {
    if (carrito.length === 0) {
        return alert("El carrito está vacío. ¡Agrega algunos productos!");
    }

    const btnPagar = document.getElementById("checkout-button");
    if (btnPagar) {
        btnPagar.disabled = true;
        btnPagar.innerText = "Procesando...";
    }

    try {
        const response = await fetch("/api/pay", {
            method: 'POST',
            body: JSON.stringify(carrito),
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        if (response.status === 409) {
            const detalles = result.detalles.map(d => `- ${d.producto}: solo quedan ${d.disponible}`).join('\n');
            throw new Error(`Lo sentimos, el stock cambió:\n${detalles}`);
        }

        if (!response.ok) throw new Error(result.error || "Error en el servidor");

        // --- 1. DEFINIR VARIABLES QUE FALTABAN ---
        const idVenta = result.idVenta; // Obtenido del servidor
        const totalFinal = result.total; // Obtenido del servidor
        
        // Armamos la lista con el ID del producto entre paréntesis
        const listaProductos = carrito.map(item => `- (${item.id}) ${item.nombre} x${item.quantity}`).join('%0A');

        // Tu número de WhatsApp (Sin el +)
        const miTelefono = "5493757677266"; 

        // --- 2. CONSTRUIR EL MENSAJE ---
        const mensaje = `¡Hola! Acabo de comprar en la web.%0A%0A` +
            `*Pedido:* ${idVenta}%0A` +
            `*Detalle:*%0A${listaProductos}%0A%0A` +
            `*Total:* $${totalFinal.toFixed(2)}%0A%0A` +
            `_Coordinemos el envío._`;

        const whatsappUrl = `https://wa.me/${miTelefono}?text=${mensaje}`;

        // Mostrar alerta y redirigir
        alert("¡Compra procesada! Ahora te redirigiremos a WhatsApp para coordinar la entrega.");
        window.open(whatsappUrl, '_blank');

        // --- 3. LIMPIEZA Y ACTUALIZACIÓN ---
        carrito = [];
        total = 0;
        saveCart();
        updateCartDisplay();
        updateCartModal();

        const cartModal = document.getElementById("cart-modal");
        if (cartModal) cartModal.style.display = "none";

        // Refrescar productos para mostrar el nuevo stock
        let type = 1;
        if (window.location.pathname.includes('juguetes')) type = 2;
        if (window.location.pathname.includes('ropa')) type = 3;
        await fetchProducts(type);

    } catch (error) {
        console.error("Error al procesar el pago:", error);
        alert(error.message);
    } finally {
        if (btnPagar) {
            btnPagar.disabled = false;
            btnPagar.innerText = "Pagar";
        }
    }
}
// Muestra los productos en la interfaz
function displayProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = productList.slice(startIndex, endIndex);

    let productsHTML = '';
    productsToDisplay.forEach(p => {
        // --- VALIDACIONES DE SEGURIDAD ---
        // 1. Verificamos que el precio exista y sea un número para evitar el error de toFixed
        const precioNumero = (p.Precio !== null && !isNaN(p.Precio)) ? p.Precio : 0;
        const precioFormateado = precioNumero.toFixed(2);

        // 2. Verificamos que las imágenes existan, si no, ponemos una por defecto
        const imgPrincipal = p.Img1 || 'https://via.placeholder.com/150?text=Sin+Imagen';

        // Lógica del botón de stock
        let buttonHTML = `<button class="button-add" onclick="add(${p.Id}, ${precioNumero})">Agregar</button>`;
        if (!p.Stock || p.Stock <= 0) {
            buttonHTML = `<button disabled class="button-add-disabled">Sin Stock</button>`;
        }

        // --- CONSTRUCCIÓN DEL HTML ---
        productsHTML += `
            <div class="product-container">
                <h3>${p.Producto || 'Producto sin nombre'}</h3>
                <div class="descr">
                    <h4>${p.Descripcion || 'Sin descripción disponible'}</h4>
                </div>
                <div class="carousel">
                    <div class="image-container" onclick="changeImage(${p.Id}, 'next')">
                        <img src="${imgPrincipal}" alt="${p.Producto}" class="product-image" id="image-${p.Id}">
                        <div class="left-click-area" onclick="changeImage(${p.Id}, 'prev')"></div>
                        <div class="right-click-area" onclick="changeImage(${p.Id}, 'next')"></div>
                    </div>
                </div>
                <div class="product-footer">
                    <h1>$ ${precioFormateado}</h1>
                    ${buttonHTML}
                </div>
            </div>`;
    });

    const container = document.getElementById("page-content");
    if (container) {
        container.innerHTML = productsHTML;
    }
    renderProducts(productsToDisplay);
    updatePagination();
}

// Función para cambiar la imagen del carrusel
function changeImage(productId, direction) {
    const product = productList.find(p => p.Id === productId);
    const images = [product.Img1, product.Img2, product.Img3].filter(Boolean); // Filtrar imágenes no definidas
    let currentImageIndex = images.indexOf(document.getElementById(`image-${productId}`).src);

    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % images.length; // Ciclo al inicio
    } else {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length; // Ciclo al final
    }

    document.getElementById(`image-${productId}`).src = images[currentImageIndex];
}

function updatePagination() {
    const totalPages = Math.ceil(productList.length / itemsPerPage);
    let paginationHTML = '';

    if (totalPages <= 1) {
        document.getElementById("pagination").innerHTML = '';
        return;
    }

    // --- Botón ANTERIOR ---
    const prevDisabled = (currentPage === 1) ? 'disabled' : '';
    paginationHTML += `<button class="page-link-custom ${prevDisabled}" 
                        onclick="changePage(${currentPage - 1}, event)" 
                        ${prevDisabled}>&laquo; </button>`;

    // --- Números de Página ---
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = (i === currentPage) ? 'active' : '';
        paginationHTML += `<button class="page-link-custom ${activeClass}" 
                            onclick="changePage(${i}, event)">${i}</button>`;
    }

    // --- Botón SIGUIENTE ---
    const nextDisabled = (currentPage === totalPages) ? 'disabled' : '';
    paginationHTML += `<button class="page-link-custom ${nextDisabled}" 
                        onclick="changePage(${currentPage + 1}, event)" 
                        ${nextDisabled}> &raquo;</button>`;

    document.getElementById("pagination").innerHTML = paginationHTML;
}

function changePage(page, event) {
    const totalPages = Math.ceil(productList.length / itemsPerPage);

    // Validar que la página esté dentro del rango
    if (page < 1 || page > totalPages) return;

    event.preventDefault();
    currentPage = page;
    displayProducts();

    // Scroll suave a la sección de productos
    const section = document.getElementById("page-content");
    section.scrollIntoView({ behavior: 'smooth' });
}

async function fetchProducts(type) {
    try {
        // 1. Cargamos el catálogo completo para el CARRITO (si está vacío)
        if (allProductsMaster.length === 0) {
            const resAll = await fetch('/api/all-products');
            allProductsMaster = await resAll.json();
        }

        // 2. Cargamos los productos de la CATEGORÍA actual para la TIENDA
        const resType = await fetch(`/api/products/${type}`);
        productList = await resType.json();

        // Filtrar por stock para la vista
        productList = productList.filter(p => p.Stock > 0);

        displayProducts();
    } catch (error) {
        console.error('Error en la carga:', error);
    }
}

function toggleSearch() {
    const searchBar = document.getElementById('mobile-search-bar');
    if (!searchBar) return;

    searchBar.classList.toggle('d-none');

    if (!searchBar.classList.contains('d-none')) {
        document.getElementById('search-input-mobile').focus();
    }
}

// Función para buscar desde el input móvil
function searchProductsMobile() {
    const searchTerm = document.getElementById('search-input-mobile').value;

    // Aquí usamos la lógica que ya tienes para filtrar
    searchProducts();
    // le pasamos el término o simplemente ejecutamos la lógica global
    if (typeof filterProducts === "function") {
        filterProducts(searchTerm);
    }

    // Opcional: cerrar la barra después de buscar
    toggleSearch();
}
// Función de búsqueda de productos
function searchProducts() {
    // Intenta obtener el valor de escritorio, si no existe o está vacío, busca el de móvil
    const desktopInput = document.getElementById('search-input');
    const mobileInput = document.getElementById('search-input-mobile');

    const searchInput = (desktopInput?.value || mobileInput?.value || "").toLowerCase().trim();

    // Si el buscador está vacío, mostramos la lista original y salimos
    if (searchInput === "") {
        displayProducts();
        return;
    }

    // Filtramos sobre la lista completa de la categoría
    const filteredProducts = productList.filter(product => {
        const nombre = product.Producto ? product.Producto.toLowerCase() : "";
        const descripcion = product.Descripcion ? product.Descripcion.toLowerCase() : "";
        return nombre.includes(searchInput) || descripcion.includes(searchInput);
    });

    if (filteredProducts.length === 0) {
        document.getElementById("page-content").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <h3 style="color: white;">No se encontraron productos que coincidan con "${searchInput}"</h3>
                <button class="button-add" onclick="resetSearch()">Ver todos los productos</button>
            </div>`;
        document.getElementById("pagination").innerHTML = "";
    } else {
        renderProducts(filteredProducts);
        document.getElementById("pagination").innerHTML = ""; // Ocultamos paginación en búsqueda
    }
}

// Función auxiliar para resetear
function resetSearch() {
    if (document.getElementById('search-input')) document.getElementById('search-input').value = "";
    if (document.getElementById('search-input-mobile')) document.getElementById('search-input-mobile').value = "";
    displayProducts();
}

function renderProducts(lista) {
    let productsHTML = '';

    lista.forEach(p => {
        const precioNumero = (p.Precio !== null && !isNaN(p.Precio)) ? parseFloat(p.Precio) : 0;
        const imgPrincipal = p.Img1 || 'https://via.placeholder.com/150?text=Sin+Imagen';

        let buttonHTML = `<button class="button-add" onclick="add(${p.Id}, ${precioNumero})">Agregar</button>`;
        if (!p.Stock || p.Stock <= 0) {
            buttonHTML = `<button disabled class="button-add-disabled">Sin Stock</button>`;
        }

        productsHTML += `
            <div class="product-container" id="product-${p.Id}">
                <h3>${p.Producto || 'Sin nombre'}</h3>
                <div class="descr"><h4>${p.Descripcion || ''}</h4></div>
                <div class="carousel">
                    <div class="image-container">
                        <img src="${imgPrincipal}" alt="${p.Producto}" class="product-image" id="image-${p.Id}">
                        <div class="left-click-area" onclick="changeImage(${p.Id}, 'prev')"></div>
                        <div class="right-click-area" onclick="changeImage(${p.Id}, 'next')"></div>
                    </div>
                </div>
                <div class="product-footer">
                    <h1>$ ${precioNumero.toFixed(2)}</h1>
                    ${buttonHTML}
                </div>
            </div>`;
    });

    const container = document.getElementById("page-content");
    if (container) container.innerHTML = productsHTML;
}

// --- CONFIGURACIÓN DE EVENTOS PRINCIPALES ---
document.addEventListener('DOMContentLoaded', async () => {
    let type = 1;
    if (window.location.pathname.includes('juguetes')) type = 2;
    if (window.location.pathname.includes('ropa')) type = 3;

    await fetchProducts(type);
    loadCart();
    autoUpdateCart();

    function closeNavbar() {
        const navbarCollapse = document.getElementById('navbarCollapse');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
            bsCollapse.hide();
        }
    }

    // Evento Abrir Carrito
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
        cartIcon.onclick = function (e) {
            e.stopPropagation(); // Evita que se cierre al intentar abrirlo
            closeNavbar();
            document.getElementById("cart-modal").style.display = "block";
            updateCartModal();
        };
    }

    // Evento Cerrar Clic Fuera
    document.addEventListener('click', function (event) {
        const modal = document.getElementById("cart-modal");
        const cartIcon = document.getElementById("cart-icon");
        const navbarCollapse = document.getElementById('navbarCollapse');
        const navbarToggler = document.querySelector('.navbar-toggler');

        // Cerrar carrito si el clic no es dentro del modal ni en el icono
        if (modal && modal.style.display === "block") {
            if (!modal.contains(event.target) && !cartIcon.contains(event.target)) {
                modal.style.display = "none";
            }
        }

        // Cerrar Navbar si se toca fuera
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
                closeNavbar();
            }
        }
    });


    // Buscador Escritorio
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => searchProducts());
    }

    // NUEVO: Buscador Móvil (el que creamos antes)
    const searchInputMobile = document.getElementById('search-input-mobile');
    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', () => searchProducts());
    }
    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
        checkoutButton.onclick = async function () {
            await pay(); // Llama a la función pay que ya tienes
        };
    }
});

// document.addEventListener('DOMContentLoaded', async () => {
//     // 1. DETERMINAR EL TIPO DE PÁGINA
//     let type = 1; 
//     if (window.location.pathname.includes('juguetes')) type = 2;
//     if (window.location.pathname.includes('ropa')) type = 3;

//     // 2. CARGAR DATOS
//     await fetchProducts(type); 
//     loadCart(); 
//     autoUpdateCart();

//     // 3. FUNCIÓN PARA CERRAR NAVBAR (Bootstrap)
//     function closeNavbar() {
//         const navbarCollapse = document.getElementById('navbarCollapse');
//         if (navbarCollapse && navbarCollapse.classList.contains('show')) {
//             const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
//             bsCollapse.hide();
//         }
//     }

//     // --- CONFIGURACIÓN DE EVENTOS ---

//     // Buscador
//     const searchForm = document.querySelector('form[role="search"]');
//     if (searchForm) {
//         searchForm.addEventListener('submit', function (event) {
//             event.preventDefault();
//             searchProducts();
//             closeNavbar(); // Opcional: cierra el menú al buscar
//         });
//     }

//     // Carrito (Abrir y cerrar Navbar)
//     const cartIcon = document.getElementById("cart-icon");
//     if (cartIcon) {
//         cartIcon.onclick = function () {
//             closeNavbar(); // ESTO soluciona lo de tu imagen: cierra el menú verde
//             document.getElementById("cart-modal").style.display = "block";
//             updateCartModal();
//         };
//     }

//     // Botón Cerrar Modal (X)
//     const closeButton = document.querySelector(".close");
//     if (closeButton) {
//         closeButton.onclick = function () {
//             document.getElementById("cart-modal").style.display = "none";
//         };
//     }

//     // Botón Pagar
//     const checkoutButton = document.getElementById("checkout-button");
//     if (checkoutButton) {
//         checkoutButton.onclick = async function () {
//             await pay();
//         };
//     }

//     // 4. DETECTAR CLIC FUERA (Para cerrar Carrito y Navbar automáticamente)
//     document.addEventListener('click', function (event) {
//         const modal = document.getElementById("cart-modal");
//         const cartIcon = document.getElementById("cart-icon");
//         const navbarCollapse = document.getElementById('navbarCollapse');
//         const navbarToggler = document.querySelector('.navbar-toggler');

//         // Cerrar Carrito si se toca fuera
//         if (modal && modal.style.display === "block") {
//             if (!modal.contains(event.target) && !cartIcon.contains(event.target)) {
//                 modal.style.display = "none";
//             }
//         }

//         // Cerrar Navbar si se toca fuera (especialmente en móviles)
//         if (navbarCollapse && navbarCollapse.classList.contains('show')) {
//             if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
//                 closeNavbar();
//             }
//         }
//     });
// });

// Función para mostrar productos filtrados
function displayFilteredProducts(filteredProducts) {
    let productsHTML = '';
    filteredProducts.forEach(p => {
        productsHTML += `
            <div class="product-container">
                <h3>${p.Producto}</h3>
                <h4>${p.Descripcion}</h4>
                <img src="${p.Img1}" alt="${p.Producto}" class="product-image">
                <h1>$ ${p.Precio.toFixed(2)}</h1>
                ${p.Stock > 0
                ? `<button class="button-add" onclick="add(${p.Id}, ${p.Precio})">Agregar</button>`
                : `<button disabled class="button-add-disabled">Sin Stock</button>`
            }
            </div>`;
    });
    document.getElementById("page-content").innerHTML = productsHTML;
}

// Función para actualizar el carrito automáticamente
function autoUpdateCart() {
    setInterval(() => {
        loadCart(); // Cargar el carrito desde el almacenamiento local
        updateCartDisplay(); // Actualizar visualización del carrito
    }, 5000); // Actualiza cada 5 segundos (5000 ms)
}