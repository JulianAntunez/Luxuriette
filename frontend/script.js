let total = 0;
let carrito = [];
let productList = [];
let productListJuguetes = [];

async function fetchProducts() {
    productList = await (await fetch("/api/products")).json();
    displayProducts(productList)
}

async function fetchJuguetes() {
    productListJuguetes = await (await fetch("/api/juguetes")).json();  
    displayProducts(productListJuguetes)
}


// Carga de carrito de compras
 function add(productId, price) {
    console.log(`Agregando producto con ID: ${productId} y precio: $${price}`);
    // const product = productList.find(p => p.ID === productId); // Cambiado a ID para que coincida
    // if (product && product.stock > 0) {
    //     product.stock--;
    //     carrito.push(productId);
    //     total += price;
    //     document.getElementById("checkout").innerHTML = `Pagar $${total.toFixed(2)}`;
    //     displayProducts();
    // } else {
    //     window.alert("Producto fuera de stock");
    // }
}

// Modificar la función displayProductos para mostrar disponibilidad
function displayProducts(productList) {
    let productsHTML = '';
    productList.forEach(p => {
        // Determina si el producto está disponible
        const disponible = p.stock > 0;
        let buttonHTML = `<button class="button-add" onclick="add(${p.ID}, '${p.Producto}', ${p.Precio})">Agregar</button>`;

        if (!disponible) {
            buttonHTML = `<button disabled class="button-add disabled">Sin Stock</button>`;
        }

        productsHTML += `
            <div class="producto ${!disponible ? 'agotado' : ''}">
                <img src="${p.Imagen}" alt="${p.Producto}">
                <h3>${p.Producto}</h3>
                <p>${p.Descripcion}</p>
                <div class="precios">
                    <h1>$${p.Precio.toFixed(2)}</h1>
                    <h2>$${p.Precio.toFixed(2)}</h2>
                </div>
                ${buttonHTML}
            </div>`;
    });
    document.getElementById('page-content').innerHTML = productsHTML;
}


// Inicialización
window.onload = async () => {
     await fetchProducts(productList);
    // const path = window.location.pathname;

    // // Cargar productos o juguetes según la página
    // if (path.includes("juguetes.html")) {
    //     await fetchJuguetes();
    // } else {
       
    // }
}



// async function pay() {
//     try {
//         const response = await fetch("/api/pay", {
//             method: "POST",
//             body: JSON.stringify(carrito),
//             headers: {
//                 "Content-Type": "application/json"
//             }
//         });

//         if (!response.ok) {
//             throw new Error("Error en el pago");
//         }

//         const productList = await response.json();
//         // Aquí puedes manejar la respuesta del servidor si es necesario
//     } catch (error) {
//         window.alert("Sin Stock");
//     } finally {
//         total = 0;
//         carrito = [];
//         await fetchProducts(); // Asegúrate de invocar correctamente la función
//         document.getElementById("checkout").innerHTML = `Pagar $${total.toFixed(2)}`;
//     }
// }


