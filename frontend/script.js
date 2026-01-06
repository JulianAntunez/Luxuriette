// let productList = [];
// let allProductsMaster = [];
// let carrito = [];
// let total = 0;
// let currentPage = 1;
// const itemsPerPage = 24;

// // Agrega un producto al carrito
// function add(productId, price) {
//     const product = productList.find(p => p.Id === productId);
//     if (product && product.Stock > 0) {
//         product.Stock--;

//         const existingProduct = carrito.find(item => item.id === productId);
//         if (existingProduct) {
//             existingProduct.quantity++;
//         } else {
//             // AGREGAMOS 'nombre' aquí para que el Excel de ventas sepa qué es
//             carrito.push({
//                 id: productId,
//                 price: price,
//                 quantity: 1,
//                 nombre: product.Producto // <--- Línea clave
//             });
//         }

//         total += price;
//         saveCart();
//         updateCartDisplay();
//     } else {
//         window.alert("No hay suficiente stock para agregar este producto.");
//     }
// }

// // Función para actualizar la visualización del carrito
// function updateCartDisplay() {
//     // 1. Calculamos la suma REAL de todas las cantidades
//     const totalArticulos = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);

//     // 2. Buscamos el elemento del círculo rojo (badge)
//     const cartCountElement = document.querySelector(".cart-count");

//     if (cartCountElement) {
//         // 3. Asignamos el total real (ej: si hay 2 productos iguales, mostrará 2)
//         cartCountElement.textContent = totalArticulos;

//         // 4. Lo ocultamos si el carrito está vacío
//         cartCountElement.style.display = totalArticulos > 0 ? "inline-block" : "none";
//     }

//     // Actualizar el total en dinero si existe el elemento checkout
//     const checkoutElement = document.getElementById("checkout");
//     if (checkoutElement) {
//         checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
//     }

//     // Actualiza el modal del carrito
//     updateCartModal();
// }
// // --- FUNCIONES DE ACTUALIZACIÓN DEL MODAL ---

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

//             // --- 1. AQUÍ SE DEFINE 'li' ---
//             const li = document.createElement('li');

//             // --- 2. SE ASIGNA EL CONTENIDO ---
//             li.innerHTML = `
//                 <a href="#product-${product.Id}" class="item-name-link" style="text-decoration: none; color: inherit;">
//                     <span class="item-name">${product.Producto}</span>
//                 </a>
//                 <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
//                 <button class="btn-remove-item" data-id="${item.id}">❌</button>
//             `;

//             // --- 3. CONFIGURAR EVENTO DEL LINK (Dentro del ámbito de 'li') ---
//             const link = li.querySelector('.item-name-link');
//             if (link) {
//                 link.onclick = () => {
//                     document.getElementById("cart-modal").style.display = "none";
//                 };
//             }

//             // --- 4. CONFIGURAR EVENTO DEL BOTÓN ELIMINAR ---
//             const btnRemove = li.querySelector('.btn-remove-item');
//             if (btnRemove) {
//                 btnRemove.onclick = function (event) {
//                     event.stopPropagation();
//                     const productId = parseInt(this.getAttribute("data-id"));
//                     remove(productId);
//                 };
//             }

//             // --- 5. AÑADIR AL CONTENEDOR ---
//             cartItems.appendChild(li);
//         }
//     });

//     cartTotal.textContent = `$${totalModal.toFixed(2)}`;
// }

// function remove(productId) {
//     const index = carrito.findIndex(item => item.id === productId);
//     if (index !== -1) {
//         if (carrito[index].quantity > 1) {
//             carrito[index].quantity--;
//             total -= carrito[index].price;
//         } else {
//             total -= carrito[index].price * carrito[index].quantity;
//             carrito.splice(index, 1);
//         }

//         saveCart();
//         updateCartDisplay();
//         // Al llamar a updateCartModal aquí, el modal se refresca pero NO se oculta
//         updateCartModal();
//     }
// }
// // Guardar el carrito en el almacenamiento local
// function saveCart() {
//     localStorage.setItem("cart", JSON.stringify(carrito));
// }

// // Cargar el carrito desde el almacenamiento local
// function loadCart() {
//     const savedCart = localStorage.getItem("cart");
//     if (savedCart) {
//         carrito = JSON.parse(savedCart);
//         total = 0; // REINICIAR TOTAL antes de recalcular
//         carrito.forEach(item => {
//             total += item.price * item.quantity;
//         });
//         updateCartDisplay();
//     }
// }

// // Procesa el pago
// async function pay() {
//     if (carrito.length === 0) {
//         return alert("El carrito está vacío. ¡Agrega algunos productos!");
//     }

//     const btnPagar = document.getElementById("checkout-button");
//     if (btnPagar) {
//         btnPagar.disabled = true;
//         btnPagar.innerText = "Procesando...";
//     }

//     try {
//         const response = await fetch("/api/pay", {
//             method: 'POST',
//             body: JSON.stringify(carrito),
//             headers: { 'Content-Type': 'application/json' },
//         });

//         const result = await response.json();

//         if (response.status === 409) {
//             const detalles = result.detalles.map(d => `- ${d.producto}: solo quedan ${d.disponible}`).join('\n');
//             throw new Error(`Lo sentimos, el stock cambió:\n${detalles}`);
//         }

//         if (!response.ok) throw new Error(result.error || "Error en el servidor");

//         // --- 1. DEFINIR VARIABLES QUE FALTABAN ---
//         const idVenta = result.idVenta; // Obtenido del servidor
//         const totalFinal = result.total; // Obtenido del servidor
        
//         // Armamos la lista con el ID del producto entre paréntesis
//         const listaProductos = carrito.map(item => `- (${item.id}) ${item.nombre} x${item.quantity}`).join('%0A');

//         // Tu número de WhatsApp (Sin el +)
//         const miTelefono = "5493757677266"; 

//         // --- 2. CONSTRUIR EL MENSAJE ---
//         const mensaje = `¡Hola *Luxuriette*! Acabo de comprar en la web.%0A%0A` +
//             `*Pedido:* ${idVenta}%0A` +
//             `*Detalle:*%0A${listaProductos}%0A%0A` +
//             `*Total:* $${totalFinal.toFixed(2)}%0A%0A` +
//             `_Coordinemos el envío._`;

//         const whatsappUrl = `https://wa.me/${miTelefono}?text=${mensaje}`;

//         // Mostrar alerta y redirigir
//         alert("¡Compra procesada! Ahora te redirigiremos a WhatsApp para coordinar la entrega.");
//         window.open(whatsappUrl, '_blank');

//         // --- 3. LIMPIEZA Y ACTUALIZACIÓN ---
//         carrito = [];
//         total = 0;
//         saveCart();
//         updateCartDisplay();
//         updateCartModal();

//         const cartModal = document.getElementById("cart-modal");
//         if (cartModal) cartModal.style.display = "none";

//         // Refrescar productos para mostrar el nuevo stock
//         let type = 1;
//         if (window.location.pathname.includes('juguetes')) type = 2;
//         if (window.location.pathname.includes('ropa')) type = 3;
//         await fetchProducts(type);

//     } catch (error) {
//         console.error("Error al procesar el pago:", error);
//         alert(error.message);
//     } finally {
//         if (btnPagar) {
//             btnPagar.disabled = false;
//             btnPagar.innerText = "Pagar";
//         }
//     }
// }
// // Muestra los productos en la interfaz
// function displayProducts() {
//     // 1. Calculamos qué productos mostrar según la página actual
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const productsToDisplay = productList.slice(startIndex, endIndex);

//     // 2. Llamamos a la función encargada de dibujar los productos en pantalla
//     renderProducts(productsToDisplay);
    
//     // 3. Actualizamos los botones de paginación
//     updatePagination();
// }

// // Función para cambiar la imagen del carrusel
// function changeImage(productId, direction) {
//     const product = productList.find(p => p.Id === productId);
//     const images = [product.Img1, product.Img2, product.Img3].filter(Boolean); // Filtrar imágenes no definidas
//     let currentImageIndex = images.indexOf(document.getElementById(`image-${productId}`).src);

//     if (direction === 'next') {
//         currentImageIndex = (currentImageIndex + 1) % images.length; // Ciclo al inicio
//     } else {
//         currentImageIndex = (currentImageIndex - 1 + images.length) % images.length; // Ciclo al final
//     }

//     document.getElementById(`image-${productId}`).src = images[currentImageIndex];
// }

// function updatePagination() {
//     const totalPages = Math.ceil(productList.length / itemsPerPage);
//     let paginationHTML = '';

//     if (totalPages <= 1) {
//         document.getElementById("pagination").innerHTML = '';
//         return;
//     }

//     // --- Botón ANTERIOR ---
//     const prevDisabled = (currentPage === 1) ? 'disabled' : '';
//     paginationHTML += `<button class="page-link-custom ${prevDisabled}" 
//                         onclick="changePage(${currentPage - 1}, event)" 
//                         ${prevDisabled}>&laquo; </button>`;

//     // --- Números de Página ---
//     for (let i = 1; i <= totalPages; i++) {
//         const activeClass = (i === currentPage) ? 'active' : '';
//         paginationHTML += `<button class="page-link-custom ${activeClass}" 
//                             onclick="changePage(${i}, event)">${i}</button>`;
//     }

//     // --- Botón SIGUIENTE ---
//     const nextDisabled = (currentPage === totalPages) ? 'disabled' : '';
//     paginationHTML += `<button class="page-link-custom ${nextDisabled}" 
//                         onclick="changePage(${currentPage + 1}, event)" 
//                         ${nextDisabled}> &raquo;</button>`;

//     document.getElementById("pagination").innerHTML = paginationHTML;
// }

// function changePage(page, event) {
//     const totalPages = Math.ceil(productList.length / itemsPerPage);

//     // Validar que la página esté dentro del rango
//     if (page < 1 || page > totalPages) return;

//     event.preventDefault();
//     currentPage = page;
//     displayProducts();

//     // Scroll suave a la sección de productos
//     const section = document.getElementById("page-content");
//     section.scrollIntoView({ behavior: 'smooth' });
// }

// async function fetchProducts(type) {
//     try {
//         // 1. Cargamos el catálogo completo para el CARRITO (si está vacío)
//         if (allProductsMaster.length === 0) {
//             const resAll = await fetch('/api/all-products');
//             allProductsMaster = await resAll.json();
//         }

//         // 2. Cargamos los productos de la CATEGORÍA actual para la TIENDA
//         const resType = await fetch(`/api/products/${type}`);
//         productList = await resType.json();

//         // Filtrar por stock para la vista
//         productList = productList.filter(p => p.Stock > 0);

//         displayProducts();
//     } catch (error) {
//         console.error('Error en la carga:', error);
//     }
// }

// function toggleSearch() {
//     const searchBar = document.getElementById('mobile-search-bar');
//     if (!searchBar) return;

//     searchBar.classList.toggle('d-none');

//     if (!searchBar.classList.contains('d-none')) {
//         document.getElementById('search-input-mobile').focus();
//     }
// }

// // Función para buscar desde el input móvil
// function searchProductsMobile() {
//     const searchTerm = document.getElementById('search-input-mobile').value;

//     // Aquí usamos la lógica que ya tienes para filtrar
//     searchProducts();
//     // le pasamos el término o simplemente ejecutamos la lógica global
//     if (typeof filterProducts === "function") {
//         filterProducts(searchTerm);
//     }

//     // Opcional: cerrar la barra después de buscar
//     toggleSearch();
// }
// // Función de búsqueda de productos
// function searchProducts() {
//     // Intenta obtener el valor de escritorio, si no existe o está vacío, busca el de móvil
//     const desktopInput = document.getElementById('search-input');
//     const mobileInput = document.getElementById('search-input-mobile');

//     const searchInput = (desktopInput?.value || mobileInput?.value || "").toLowerCase().trim();

//     // Si el buscador está vacío, mostramos la lista original y salimos
//     if (searchInput === "") {
//         displayProducts();
//         return;
//     }

//     // Filtramos sobre la lista completa de la categoría
//     const filteredProducts = productList.filter(product => {
//         const nombre = product.Producto ? product.Producto.toLowerCase() : "";
//         const descripcion = product.Descripcion ? product.Descripcion.toLowerCase() : "";
//         return nombre.includes(searchInput) || descripcion.includes(searchInput);
//     });

//     if (filteredProducts.length === 0) {
//         document.getElementById("page-content").innerHTML = `
//             <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
//                 <h3 style="color: white;">No se encontraron productos que coincidan con "${searchInput}"</h3>
//                 <button class="button-add" onclick="resetSearch()">Ver todos los productos</button>
//             </div>`;
//         document.getElementById("pagination").innerHTML = "";
//     } else {
//         renderProducts(filteredProducts);
//         document.getElementById("pagination").innerHTML = ""; // Ocultamos paginación en búsqueda
//     }
// }

// // Función auxiliar para resetear
// function resetSearch() {
//     if (document.getElementById('search-input')) document.getElementById('search-input').value = "";
//     if (document.getElementById('search-input-mobile')) document.getElementById('search-input-mobile').value = "";
//     displayProducts();
// }

// function renderProducts(lista) {
//     let productsHTML = '';

//     lista.forEach(p => {
//         const precioNumero = (p.Precio !== null && !isNaN(p.Precio)) ? parseFloat(p.Precio) : 0;
//         const imgPrincipal = p.Img1 || 'https://via.placeholder.com/150?text=Sin+Imagen';

//         let buttonHTML = `<button class="button-add" onclick="add(${p.Id}, ${precioNumero})">Agregar</button>`;
//         if (!p.Stock || p.Stock <= 0) {
//             buttonHTML = `<button disabled class="button-add-disabled">Sin Stock</button>`;
//         }

//         productsHTML += `
//             <div class="product-container" id="product-${p.Id}">
//                 <h3>${p.Producto || 'Sin nombre'}</h3>
//                 <div class="descr"><h4>${p.Descripcion || ''}</h4></div>
//                 <div class="carousel">
//                     <div class="image-container">
//                         <img src="${imgPrincipal}" alt="${p.Producto}" class="product-image" id="image-${p.Id}">
//                         <div class="left-click-area" onclick="changeImage(${p.Id}, 'prev')"></div>
//                         <div class="right-click-area" onclick="changeImage(${p.Id}, 'next')"></div>
//                     </div>
//                 </div>
//                 <div class="product-footer">
//                     <h1>$ ${precioNumero.toFixed(2)}</h1>
//                     ${buttonHTML}
//                 </div>
//             </div>`;
//     });

//     const container = document.getElementById("page-content");
//     if (container) container.innerHTML = productsHTML;
// }

// // --- CONFIGURACIÓN DE EVENTOS PRINCIPALES ---
// document.addEventListener('DOMContentLoaded', async () => {
//     let type = 1;
//     if (window.location.pathname.includes('juguetes')) type = 2;
//     if (window.location.pathname.includes('ropa')) type = 3;

//     await fetchProducts(type);
//     loadCart();
//     autoUpdateCart();

//     function closeNavbar() {
//         const navbarCollapse = document.getElementById('navbarCollapse');
//         if (navbarCollapse && navbarCollapse.classList.contains('show')) {
//             const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
//             bsCollapse.hide();
//         }
//     }

//     // Evento Abrir Carrito
//     const cartIcon = document.getElementById("cart-icon");
//     if (cartIcon) {
//         cartIcon.onclick = function (e) {
//             e.stopPropagation(); // Evita que se cierre al intentar abrirlo
//             closeNavbar();
//             document.getElementById("cart-modal").style.display = "block";
//             updateCartModal();
//         };
//     }

//     // Evento Cerrar Clic Fuera
//     document.addEventListener('click', function (event) {
//         const modal = document.getElementById("cart-modal");
//         const cartIcon = document.getElementById("cart-icon");
//         const navbarCollapse = document.getElementById('navbarCollapse');
//         const navbarToggler = document.querySelector('.navbar-toggler');

//         // Cerrar carrito si el clic no es dentro del modal ni en el icono
//         if (modal && modal.style.display === "block") {
//             if (!modal.contains(event.target) && !cartIcon.contains(event.target)) {
//                 modal.style.display = "none";
//             }
//         }

//         // Cerrar Navbar si se toca fuera
//         if (navbarCollapse && navbarCollapse.classList.contains('show')) {
//             if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
//                 closeNavbar();
//             }
//         }
//     });



//     const searchInput = document.getElementById('search-input');
//     if (searchInput) {
//         searchInput.addEventListener('input', () => searchProducts());
//     }

    
//     const searchInputMobile = document.getElementById('search-input-mobile');
//     if (searchInputMobile) {
//         searchInputMobile.addEventListener('input', () => searchProducts());
//     }
//     const checkoutButton = document.getElementById("checkout-button");
//     if (checkoutButton) {
//         checkoutButton.onclick = async function () {
//             await pay(); 
//         };
//     }
// });


// // function displayFilteredProducts(filteredProducts) {
// //     let productsHTML = '';
// //     filteredProducts.forEach(p => {
// //         productsHTML += `
// //             <div class="product-container">
// //                 <h3>${p.Producto}</h3>
// //                 <h4>${p.Descripcion}</h4>
// //                 <img src="${p.Img1}" alt="${p.Producto}" class="product-image">
// //                 <h1>$ ${p.Precio.toFixed(2)}</h1>
// //                 ${p.Stock > 0
// //                 ? `<button class="button-add" onclick="add(${p.Id}, ${p.Precio})">Agregar</button>`
// //                 : `<button disabled class="button-add-disabled">Sin Stock</button>`
// //             }
// //             </div>`;
// //     });
// //     document.getElementById("page-content").innerHTML = productsHTML;
// // }

// // Función para actualizar el carrito automáticamente
// function autoUpdateCart() {
//     setInterval(() => {
//         loadCart(); // Cargar el carrito desde el almacenamiento local
//         updateCartDisplay(); // Actualizar visualización del carrito
//     }, 5000); // Actualiza cada 5 segundos (5000 ms)
// }
// document.addEventListener("DOMContentLoaded", function() {
//     // Verificamos si ya aceptó la edad anteriormente (usando localStorage)
//     if (localStorage.getItem("ageVerified") === "true") {
//         document.getElementById("age-verification-modal").style.display = "none";
//     }
// });

// function verifyAge() {
//     // Guardamos la verificación para que no pregunte de nuevo en esta PC/celular
//     localStorage.setItem("ageVerified", "true");
//     document.getElementById("age-verification-modal").style.display = "none";
// }

// function rejectAge() {
//     // Si dice que no, lo mandamos a Google
//     window.location.href = "https://www.google.com";
// }
let productList = [];
let allProductsMaster = [];
let carrito = [];
let total = 0;
let currentPage = 1;
const itemsPerPage = 24;

// --- 1. FUNCIONES GLOBALES (ACCESIBLES DESDE EL HTML) ---

// Verificación de Edad
function verifyAge() {
    localStorage.setItem("ageVerified", "true");
    const modal = document.getElementById("age-verification-modal");
    if (modal) modal.style.display = "none";
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

// document.addEventListener('DOMContentLoaded', () => {
//     // Verificar edad
//     const btnYes = document.getElementById("btn-age-yes");
//     if (btnYes) {
//         btnYes.onclick = verifyAge; // Llama a la función que ya tienes escrita
//     }
//     const btnNo = document.getElementById("btn-age-no");
//     if (btnNo) {
//         btnNo.onclick = rejectAge; // Llama a la función que te manda a Google
//     }
//     if (localStorage.getItem("ageVerified") === "true") {
//         const modal = document.getElementById("age-verification-modal");
//         if (modal) modal.style.display = "none";
//     } else {
//         const modal = document.getElementById("age-verification-modal");
//         if (modal) modal.style.display = "flex"; // Forzamos que se vea si no hay verificación
//     }

//     let type = 1;
//     if (location.pathname.includes('juguetes')) type = 2;
//     if (location.pathname.includes('ropa')) type = 3;
//     fetchProducts(type);
//     loadCart();

//     // Eventos de Input
//     document.getElementById('search-input')?.addEventListener('input', searchProducts);
//     document.getElementById('search-input-mobile')?.addEventListener('input', searchProducts);

//     // Abrir Carrito
//     document.getElementById("cart-icon").onclick = (e) => {
//         e.stopPropagation();
//         document.getElementById("cart-modal").style.display = "block";
//         updateCartModal();
//     };

//     // Cerrar al hacer clic fuera
//     document.addEventListener('click', (e) => {
//         const modal = document.getElementById("cart-modal");
//         if (modal?.style.display === "block" && !modal.contains(e.target) && !document.getElementById("cart-icon").contains(e.target)) {
//             modal.style.display = "none";
//         }
//     });
// });
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

    // 2. Carga Dinámica de Productos (EL ARREGLO ESTÁ AQUÍ)
    const container = document.getElementById("page-content");
    
    if (container) {
        // Definimos 'type' con un valor por defecto
        let type = 1; 
        if (location.pathname.includes('juguetes')) type = 2;
        if (location.pathname.includes('ropa')) type = 3;
        
        fetchProducts(type); // Ahora 'type' siempre existe aquí
    } else {
        console.log("Página sin contenedor de productos (Inicio).");
    }

    // 3. Inicializar Carrito y Buscadores
    loadCart();

    document.getElementById('search-input')?.addEventListener('input', searchProducts);
    document.getElementById('search-input-mobile')?.addEventListener('input', searchProducts);

    // 4. Lógica del Carrito
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