let productList = [];
let carrito = [];
let total = 0;
let currentPage = 1;
const itemsPerPage = 24;


// window.onload = async () => {
//     await fetchProducts(1);
//     loadCart();
//     autoUpdateCart(); // Llama a la función de actualización automática
// };

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
    const checkoutElement = document.getElementById("checkout");
    if (checkoutElement) {
        checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
    }

    // Actualiza contador del carrito
    document.querySelector(".cart-count").textContent = carrito.length;

    // Actualiza el modal del carrito
    updateCartModal();
}

// Renderiza el carrito en el modal
// function updateCartModal() {
//     const cartItems = document.getElementById("cart-items");
//     const cartTotal = document.getElementById("cart-total");
//     cartItems.innerHTML = '';

//     let totalModal = 0;

//     carrito.forEach(item => {
//         const product = productList.find(p => p.Id == item.id);
//         const quantity = item.quantity;
//         const subtotal = quantity * product.Precio;
//         totalModal += subtotal;

//         const li = document.createElement('li');
//         li.innerHTML = `
//             <span class="item-name">${product.Producto}</span>
//             <span class="item-price">${quantity}  x  $${product.Precio.toFixed(2)}</span>
//             <button onclick="remove(${item.id})">❌</button>
//         `;
//         cartItems.appendChild(li);
//     });

//     cartTotal.textContent = `$${totalModal.toFixed(2)}`;
// }
function updateCartModal() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    if (!cartItems || !cartTotal) return; // Seguridad por si no existen los elementos

    cartItems.innerHTML = '';
    let totalModal = 0;

    carrito.forEach(item => {
        // Buscamos el producto en la lista cargada
        const product = productList.find(p => p.Id == item.id);
        
        // SI EL PRODUCTO EXISTE EN LA LISTA:
        if (product) {
            const quantity = item.quantity || 1;
            const precio = parseFloat(product.Precio) || 0;
            const subtotal = quantity * precio;
            totalModal += subtotal;

            const li = document.createElement('li');
            li.innerHTML = `
                <span class="item-name">${product.Producto}</span>
                <span class="item-price">${quantity} x $${precio.toFixed(2)}</span>
                <button onclick="remove(${item.id})">❌</button>
            `;
            cartItems.appendChild(li);
        } else {
            // Si el producto no está en la lista (ej. se borró del Excel)
            console.warn(`Producto con ID ${item.id} no encontrado en la lista actual.`);
        }
    });

    cartTotal.textContent = `$${totalModal.toFixed(2)}`;
}

// Función para eliminar un producto del carrito
function remove(productId) {
    const index = carrito.findIndex(item => item.id === productId);
    if (index !== -1) {
        // Verifica si hay más de uno en el carrito
        if (carrito[index].quantity > 1) {
            // Reduce la cantidad
            carrito[index].quantity--;
            total -= carrito[index].price; // Restar el precio del total
        } else {
            // Si solo hay uno, elimina el producto del carrito
            total -= carrito[index].price * carrito[index].quantity; // Restar del total
            carrito.splice(index, 1); // Eliminar producto del carrito
        }
        saveCart(); // Guardar cambios en almacenamiento local
        updateCartDisplay(); // Actualizar visualización
        updateCartModal(); // Asegúrate de actualizar el modal del carrito
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
// function displayProducts() {
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     const productsToDisplay = productList.slice(startIndex, endIndex);

//     let productsHTML = '';
//     productsToDisplay.forEach(p => {
//         let buttonHTML = `<button class="button-add" onclick="add(${p.Id}, ${p.Precio})">Agregar</button>`;

//         if (p.Stock <= 0) {
//             buttonHTML = `<button disabled class="button-add-disabled">Sin Stock</button>`;
//         }

//         // Crear el carrusel de imágenes
//         productsHTML += `
//             <div class="product-container">
//                 <h3>${p.Producto}</h3>
//                 <div class="descr">
//                     <h4>${p.Descripcion}</h4>
//                 </div>
//                 <div class="carousel">
//                     <div class="image-container" onclick="changeImage(${p.Id}, 'next')">
//                         <img src="${p.Img1}" alt="${p.Producto}" class="product-image" id="image-${p.Id}">
//                         <div class="left-click-area" onclick="changeImage(${p.Id}, 'prev')"></div>
//                         <div class="right-click-area" onclick="changeImage(${p.Id}, 'next')"></div>
//                     </div>
//                 </div>
//                 <div class="product-footer">
//                     <h1>$ ${p.Precio.toFixed(2)}</h1>
//                     ${buttonHTML}
//                 </div>
//             </div>`;
//     });
//     document.getElementById("page-content").innerHTML = productsHTML;
//     updatePagination();
// }

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

// async function fetchProducts() {
//     try {
//         const response = await fetch('/api/products?sheet=Productos'); // Asegúrate de que esta línea esté correcta
//         productList = await response.json();

//         // Filtrar los productos con stock disponible
//         productList = productList.filter(product => product.Stock > 0);

//         // Actualizar la lista de productos en la interfaz
//         displayProducts(); // Muestra los productos
//     } catch (error) {
//         console.error('Error al cargar los productos:', error);
//     }
// }
async function fetchProducts(type) {
    try {
        const response = await fetch(`/api/products/${type}`); // Cambia aquí para usar el tipo
        productList = await response.json();

        // Filtrar los productos con stock disponible
       productList = productList.filter(p => p.Id && p.Producto); 
displayProducts();
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

// Función de búsqueda de productos
function searchProducts() {
    const searchInput = document.querySelector('.form-control').value.toLowerCase(); // Obtener el valor de búsqueda
    const filteredProducts = productList.filter(product =>
        product.Producto.toLowerCase().includes(searchInput) // Filtrar productos que contengan el texto de búsqueda
    );

    displayFilteredProducts(filteredProducts); // Mostrar los productos filtrados
}

// Agregar un event listener al formulario
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Evitar el envío del formulario
            searchProducts(); // Llamar a la función de búsqueda
        });
    } else {
        console.error('El formulario de búsqueda no se encontró');
    }

    // Manejar el icono del carrito
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
        cartIcon.onclick = function () {
            document.getElementById("cart-modal").style.display = "block";
            updateCartModal(); // Asegúrate de llamar a esta función al abrir el modal
        };
    } else {
        console.error('El icono del carrito no se encontró');
    }

    // Manejar el botón de cerrar del modal
    const closeButton = document.querySelector(".close");
    if (closeButton) {
        closeButton.onclick = function () {
            document.getElementById("cart-modal").style.display = "none";
        };
    } else {
        console.error('El botón de cerrar no se encontró');
    }

    // Manejar el botón de pago
    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
        checkoutButton.onclick = async function () {
            await pay();
        };
    } else {
        console.error('El botón de pago no se encontró');
    }

    // Cerrar el modal si se hace clic fuera
    window.onclick = function (event) {
        const modal = document.getElementById("cart-modal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
});

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

// Reemplaza todos tus window.onload por este bloque único:
document.addEventListener('DOMContentLoaded', async () => {
    // Detectar el tipo según la página (puedes usar una variable global en el HTML o el nombre del archivo)
    let type = 1; // Por defecto
    if (window.location.pathname.includes('juguetes')) type = 2;
    if (window.location.pathname.includes('ropa')) type = 3;

    await fetchProducts(type);
    loadCart();
    autoUpdateCart();
});