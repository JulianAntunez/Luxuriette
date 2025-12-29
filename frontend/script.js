let productList = [];
let carrito = [];
let total = 0;
let currentPage = 1;
const itemsPerPage = 24;

// Agrega un producto al carrito
function add(productId, price) {
    const product = productList.find(p => p.Id === productId);
    if (product && product.Stock > 0) {
        product.Stock--;
        carrito.push(productId);
        total += price;

        // Actualiza el total en la sección principal
        const checkoutElement = document.getElementById("checkout");
        if (checkoutElement) {
            checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
        }

        // Actualiza contador del carrito
        document.querySelector(".cart-count").textContent = carrito.length;

        // Actualiza el modal del carrito
        updateCartModal();
    } else {
        window.alert("No hay suficiente stock para agregar este producto.");
    }
}

// Renderiza el carrito en el modal
function updateCartModal() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    cartItems.innerHTML = '';

    // Agrupa productos por ID
    const grouped = {};
    carrito.forEach(id => {
        grouped[id] = (grouped[id] || 0) + 1;
    });

    let totalModal = 0;

    for (const id in grouped) {
        const product = productList.find(p => p.Id == id);
        const quantity = grouped[id];
        const subtotal = quantity * product.Precio;
        totalModal += subtotal;

        const li = document.createElement('li');
        li.innerHTML = `
            <span class="item-name">${product.Producto}</span>
            <span class="item-price">${quantity} X $${product.Precio.toFixed(2)}</span>
        `;
        cartItems.appendChild(li);
    }

    cartTotal.textContent = `$${totalModal.toFixed(2)}`;
}

// Procesa el pago
async function pay() {
    try {
        const response = await fetch("/api/pay", {
            method: 'POST',
            body: JSON.stringify(carrito),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        productList = await response.json();
        carrito = []; // Vaciar el carrito
        total = 0; // Reiniciar el total

        // Actualizar la interfaz del carrito
        document.querySelector(".cart-count").textContent = 0;
        document.getElementById("cart-total").innerHTML = "Total: $0.00";
        updateCartModal(); // Actualizar el modal del carrito

        await fetchProducts(); // Volver a cargar los productos actualizados

        // Mostrar mensaje de éxito
        window.alert("¡Pago realizado con éxito!");
    } catch (error) {
        console.error("Error al procesar el pago:", error);
        window.alert("No hay stock");
    }
}

// Muestra los productos en la interfaz
// // // // function displayProducts() {
// // // //     const startIndex = (currentPage - 1) * itemsPerPage;
// // // //     const endIndex = startIndex + itemsPerPage;
// // // //     const productsToDisplay = productList.slice(startIndex, endIndex);

// // // //     let productsHTML = '';
// // // //     productsToDisplay.forEach(p => {
// // // //         let buttonHTML = `<button class="button-add" onclick="add(${p.Id}, ${p.Precio})">Agregar</button>`;

// // // //         if (p.Stock <= 0) {
// // // //             buttonHTML = `<button disabled class="button-add-disabled">Sin Stock</button>`;
// // // //         }

// // // //         productsHTML += `
// // // //             <div class="product-container">
// // // //                 <h3>${p.Producto}</h3>
// // // //                 <div class="descr">
// // // //                     <h4>${p.Descripcion}</h4>
// // // //                 </div>  
// // // //                 <img src="${p.Img1}" alt="${p.Producto}" class="product-image">
// // // //                 <h1>$ ${p.Precio.toFixed(2)}</h1>
// // // //                 ${buttonHTML}
// // // //             </div>`;
// // // //     });
// // // //     document.getElementById("page-content").innerHTML = productsHTML;
// // // //     updatePagination();
// // // // }
function displayProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = productList.slice(startIndex, endIndex);

    let productsHTML = '';
    productsToDisplay.forEach(p => {
        let buttonHTML = `<button class="button-add" onclick="add(${p.Id}, ${p.Precio})">Agregar</button>`;

        if (p.Stock <= 0) {
            buttonHTML = `<button disabled class="button-add-disabled">Sin Stock</button>`;
        }

        // Crear el carrusel de imágenes
        productsHTML += `
            <div class="product-container">
                <h3>${p.Producto}</h3>
                <div class="descr">
                    <h4>${p.Descripcion}</h4>
                </div>
                <div class="carousel">
                    <div class="image-container" onclick="changeImage(${p.Id}, 'next')">
                        <img src="${p.Img1}" alt="${p.Producto}" class="product-image" id="image-${p.Id}">
                        <div class="left-click-area" onclick="changeImage(${p.Id}, 'prev')"></div>
                        <div class="right-click-area" onclick="changeImage(${p.Id}, 'next')"></div>
                    </div>
                </div>
                <div class="product-footer">
                    <h1>$ ${p.Precio.toFixed(2)}</h1>
                    ${buttonHTML}
                </div>
            </div>`;
    });
    document.getElementById("page-content").innerHTML = productsHTML;
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

async function fetchProducts() {
    try {
        const response = await fetch('/api/products?sheet=Productos'); // Asegúrate de que esta línea esté correcta
        productList = await response.json();

        // Filtrar los productos con stock disponible
        productList = productList.filter(product => product.Stock > 0);

        // Actualizar la lista de productos en la interfaz
        displayProducts(); // Muestra los productos
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
    
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar el envío del formulario
        searchProducts(); // Llamar a la función de búsqueda
    });
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

// Carga los productos al iniciar la página
window.onload = async () => {
    await fetchProducts();
};

// Abre el modal del carrito
document.getElementById("cart-icon").onclick = function () {
    document.getElementById("cart-modal").style.display = "block";
    updateCartModal(); // Asegúrate de llamar a esta función al abrir el modal
};

// Cierra el modal del carrito
document.querySelector(".close").onclick = function () {
    document.getElementById("cart-modal").style.display = "none";
};

function closeModal() {
    document.getElementById("cart-modal").style.display = "none";
}

// Pagar las cosas del carrito
document.getElementById("checkout-button").onclick = async function () {
    await pay();
};

// Cierra el modal si se hace clic fuera
window.onclick = function (event) {
    const modal = document.getElementById("cart-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

document.querySelector('.search-input').addEventListener('input', searchProducts);



// let productList = [];
// let carrito = [];
// let total = 0;
// let currentPage = 1;
// const itemsPerPage = 24;

// // Agrega un producto al carrito
// // function add(productId, price) {
// //     const product = productList.find(p => p.Id === productId);
// //     if (product && product.Stock > 0) {
// //         product.Stock--;
// //         carrito.push(productId);
// //         total += price;

// //         // Actualiza el total en la sección principal
// //         const checkoutElement = document.getElementById("checkout");
// //         if (checkoutElement) {
// //             checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
// //         }

// //         // Actualiza contador del carrito
// //         document.querySelector(".cart-count").textContent = carrito.length;

// //         // Actualiza el modal del carrito
// //         updateCartModal();

// //         displayProducts();
// //     } else {
// //         window.alert("No hay suficiente stock para agregar este producto.");
// //     }
// // }

// // Agrega un producto al carrito
// function add(productId, price) {
//     const product = productList.find(p => p.Id === productId);
//     if (product && product.Stock > 0) {
//         product.Stock--;
//         carrito.push(productId);
//         total += price;

//         // Actualiza el total en la sección principal
//         const checkoutElement = document.getElementById("checkout");
//         if (checkoutElement) {
//             checkoutElement.innerHTML = "Total: $ " + total.toFixed(2);
//         }

//         // Actualiza contador del carrito
//         document.querySelector(".cart-count").textContent = carrito.length;

//         // Actualiza el modal del carrito
//         updateCartModal();
//     } else {
//         window.alert("No hay suficiente stock para agregar este producto.");
//     }
// }

// // Renderiza el carrito en el modal
// function updateCartModal() {
//     const cartItems = document.getElementById("cart-items");
//     const cartTotal = document.getElementById("cart-total");
//     cartItems.innerHTML = '';

//     // Agrupa productos por ID
//     const grouped = {};
//     carrito.forEach(id => {
//         grouped[id] = (grouped[id] || 0) + 1;
//     });

//     let totalModal = 0;

//     for (const id in grouped) {
//         const product = productList.find(p => p.Id == id);
//         const quantity = grouped[id];
//         const subtotal = quantity * product.Precio;
//         totalModal += subtotal;

//         const li = document.createElement('li');
//         li.innerHTML = `
//             <span class="item-name">${product.Producto}</span>
//             <span class="item-price">${quantity} X $${product.Precio.toFixed(2)}</span>
//         `;
//         cartItems.appendChild(li);
//     }

//     cartTotal.textContent = `$${totalModal.toFixed(2)}`;
// }
// // Procesa el pago
// async function pay() {
//     try {
//         const response = await fetch("/api/pay", {
//             method: 'POST',
//             body: JSON.stringify(carrito),
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//         });

//         if (!response.ok) {
//             throw new Error(`Error: ${response.status} ${response.statusText}`);
//         }

//         productList = await response.json();
//         carrito = []; // Vaciar el carrito
//         total = 0; // Reiniciar el total

//         // Actualizar la interfaz del carrito
//         document.querySelector(".cart-count").textContent = 0;
//         document.getElementById("cart-total").innerHTML = "Total: $0.00";
//         updateCartModal(); // Actualizar el modal del carrito

//         await fetchProducts(); // Volver a cargar los productos actualizados

//         // Mostrar mensaje de éxito
//         window.alert("¡Pago realizado con éxito!");
//     } catch (error) {
//         console.error("Error al procesar el pago:", error);
//         window.alert("No hay stock");
//     }
// }
// // Muestra los productos en la interfaz
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

//         productsHTML += `
//             <div class="product-container">
//                 <h3>${p.Producto}</h3>
//                 <div class="descr">
//                     <h4>${p.Descripcion}</h4>
//                 </div>  
//                 <img src="${p.Img1}" alt="${p.Producto}" class="product-image">
//                 <h1>$ ${p.Precio.toFixed(2)}</h1>
//                 ${buttonHTML}
//             </div>`;
//     });
//     document.getElementById("page-content").innerHTML = productsHTML;
//     updatePagination();
// }
// // Actualiza la paginación
// function updatePagination() {
//     const totalPages = Math.ceil(productList.length / itemsPerPage);
//     let paginationHTML = '';

//     for (let i = 1; i <= totalPages; i++) {
//         const isActive = (i === currentPage) ? 'active' : ''; // Clase para la página activa
//         paginationHTML += `<button class="page-button ${isActive}" onclick="changePage(${i}, event)">${i}</button>`;
//     }

//     document.getElementById("pagination").innerHTML = paginationHTML;
// }
// // Cambia de página
// function changePage(page, event) {
//     event.preventDefault(); // Evitar el comportamiento predeterminado
//     currentPage = page;
//     displayProducts();

//     // Evitar el desplazamiento a la parte superior
//     window.scrollTo(0, 0);
// }

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

// // Función de búsqueda de productos
// function searchProducts() {
//     const searchInput = document.querySelector('.form-control').value.toLowerCase(); // Obtener el valor de búsqueda
//     const filteredProducts = productList.filter(product =>
//         product.Producto.toLowerCase().includes(searchInput) // Filtrar productos que contengan el texto de búsqueda
//     );

//     displayFilteredProducts(filteredProducts); // Mostrar los productos filtrados
// }

// // Agregar un event listener al formulario
// document.addEventListener('DOMContentLoaded', () => {
//     const searchForm = document.querySelector('form[role="search"]');
    
//     searchForm.addEventListener('submit', function(event) {
//         event.preventDefault(); // Evitar el envío del formulario
//         searchProducts(); // Llamar a la función de búsqueda
//     });
// });

// // Función para mostrar productos filtrados
// function displayFilteredProducts(filteredProducts) {
//     let productsHTML = '';
//     filteredProducts.forEach(p => {
//         productsHTML += `
//             <div class="product-container">
//                 <h3>${p.Producto}</h3>
//                 <h4>${p.Descripcion}</h4>
//                 <img src="${p.Img1}" alt="${p.Producto}" class="product-image">
//                 <h1>$ ${p.Precio.toFixed(2)}</h1>
//                 ${p.Stock > 0
//                 ? `<button class="button-add" onclick="add(${p.Id}, ${p.Precio})">Agregar</button>`
//                 : `<button disabled class="button-add-disabled">Sin Stock</button>`
//             }
//             </div>`;
//     });
//     document.getElementById("page-content").innerHTML = productsHTML;
// }
// // Carga los productos al iniciar la página
// window.onload = async () => {
//     await fetchProducts();
    
// };
// // Abre el modal del carrito
// document.getElementById("cart-icon").onclick = function () {
//     document.getElementById("cart-modal").style.display = "block";
//     updateCartModal(); // Asegúrate de llamar a esta función al abrir el modal
// };
// // Cierra el modal del carrito
// document.querySelector(".close").onclick = function () {
//     document.getElementById("cart-modal").style.display = "none";
// };
// function closeModal() {
//     document.getElementById("cart-modal").style.display = "none";
// }
// //Pagar las cosas del carrito
// document.getElementById("checkout-button").onclick = async function () {
//     await pay();
// };
// // Cierra el modal si se hace clic fuera
// window.onclick = function (event) {
//     const modal = document.getElementById("cart-modal");
//     if (event.target === modal) {
//         modal.style.display = "none";
//     }
// };
// document.querySelector('.search-input').addEventListener('input', searchProducts);

