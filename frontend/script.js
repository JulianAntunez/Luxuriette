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

        // Verificar si el producto ya está en el carrito
        const existingProduct = carrito.find(item => item.id === productId);
        if (existingProduct) {
            existingProduct.quantity++; // Incrementar cantidad si ya está en el carrito
        } else {
            carrito.push({ id: productId, price: price, quantity: 1 }); // Agregar nuevo producto
        }

        total += price;
        saveCart(); // Guardar en almacenamiento local
        updateCartDisplay(); // Actualizar visualización del carrito
    } else {
        window.alert("No hay suficiente stock para agregar este producto.");
    }
}

// Función para actualizar la visualización del carrito
function updateCartDisplay() {
    const totalArticulos = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const cartCountElement = document.querySelector("#cart-icon .cart-count");

    if (cartCountElement) {
        cartCountElement.textContent = totalArticulos;
        // Mostrar solo si hay más de 0 productos
        cartCountElement.style.display = totalArticulos > 0 ? "inline-block" : "none";
    }

    const checkoutElement = document.getElementById("checkout");
    if (checkoutElement) {
        checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
    }

    // Actualiza contador del carrito
    document.querySelector(".cart-count").textContent = carrito.length;

    // Actualiza el modal del carrito
    updateCartModal();
}

// --- FUNCIONES DE ACTUALIZACIÓN DEL MODAL ---
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
                <span class="item-name">${product.Producto}</span>
                <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
                <button class="btn-remove-item" data-id="${item.id}">❌</button>
            `;
            cartItems.appendChild(li);
        }
    });

    // Manejador de clics para eliminar SIN cerrar el modal
    const removeButtons = document.querySelectorAll(".btn-remove-item");
    removeButtons.forEach(button => {
        button.onclick = function(event) {
            event.stopPropagation(); // Evita que el clic cierre el carrito
            const productId = parseInt(this.getAttribute("data-id"));
            remove(productId); 
        };
    });

    cartTotal.textContent = `$${totalModal.toFixed(2)}`;
}
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

//             const li = document.createElement('li');
//             // IMPORTANTE: Quitamos el onclick="remove()" del HTML y usamos una clase
//             li.innerHTML = `
//                 <span class="item-name">${product.Producto}</span>
//                 <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
//                 <button class="btn-remove-item" data-id="${item.id}" style="cursor:pointer; background:none; border:none;">❌</button>
//             `;
//             cartItems.appendChild(li);
//         }
//     });

//     // Manejador de clics para los botones de eliminar (Corregido)
//     const removeButtons = document.querySelectorAll(".btn-remove-item");
//     removeButtons.forEach(button => {
//         button.onclick = function(event) {
//             // Esto evita que el clic llegue al 'document' y cierre el modal
//             event.stopPropagation(); 
            
//             const productId = parseInt(this.getAttribute("data-id"));
//             remove(productId); 
//         };
//     });

//     cartTotal.textContent = `$${totalModal.toFixed(2)}`;
// }
// Función para eliminar un producto del carrito

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
        carrito.forEach(item => {
            const product = productList.find(p => p.Id === item.id);
            if (product) {
                total += item.price * item.quantity; // Calcular el total inicial
            }
        });
        updateCartDisplay(); // Actualizar visualización del carrito
    }
}

// Procesa el pago
async function pay() {
    try {
        if (carrito.length === 0) return alert("El carrito está vacío");

        const response = await fetch("/api/pay", {
            method: 'POST',
            // ENVIAMOS EL OBJETO COMPLETO (id y quantity)
            body: JSON.stringify(carrito), 
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const result = await response.json();

        if (!response.ok) {
            // Si el error es 409, mostramos qué productos faltan
            if (response.status === 409) {
                const detalles = result.detalles.map(d => `- ${d.producto}: solo quedan ${d.disponible}`).join('\n');
                throw new Error(`Stock insuficiente:\n${detalles}`);
            }
            throw new Error(result.error || "Error en el pago");
        }

        // Si llega aquí, el pago fue exitoso
        productList = result; // Actualizamos la lista local con el nuevo stock
        carrito = [];
        total = 0;
        
        saveCart();
        updateCartDisplay();
        updateCartModal();
        displayProducts(); // Refrescar la vista de productos inmediatamente

        window.alert("¡Pago realizado con éxito!");
    } catch (error) {
        console.error("Error al procesar el pago:", error);
        window.alert(error.message); // Mostrará el mensaje específico de falta de stock
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

// Actualiza la paginación
function updatePagination() {
    const totalPages = Math.ceil(productList.length / itemsPerPage);
    let paginationHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const isActive = (i === currentPage) ? 'active' : ''; // Clase para la página activa
        paginationHTML += `<button class="page-button ${isActive}" onclick="changePage(${i}, event)">${i}</button>`;
    }

    document.getElementById("pagination").innerHTML = paginationHTML;
}

// Cambia de página
function changePage(page, event) {
    event.preventDefault(); // Evitar el comportamiento predeterminado
    currentPage = page;
    displayProducts();

    // Evitar el desplazamiento a la parte superior
    window.scrollTo(0, 0);
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



// Función de búsqueda de productos
function searchProducts() {
    const searchInput = document.querySelector('.form-control').value.toLowerCase().trim();
    
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

    // Si no hay resultados, mostramos un mensaje amistoso
    if (filteredProducts.length === 0) {
        document.getElementById("page-content").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <h3>No se encontraron productos que coincidan con "${searchInput}"</h3>
                <button class="button-add" onclick="resetSearch()">Ver todos los productos</button>
            </div>`;
        document.getElementById("pagination").innerHTML = ""; // Ocultar paginación
    } else {
        // Reutilizamos displayProducts pero pasándole los filtrados
        renderProducts(filteredProducts);
    }
}

// Función auxiliar para resetear
function resetSearch() {
    document.querySelector('.form-control').value = "";
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
            <div class="product-container">
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

    const searchInput = document.querySelector('.form-control');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        searchProducts(); // Se ejecuta cada vez que escribes una letra
    });
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
