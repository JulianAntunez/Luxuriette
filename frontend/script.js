let total = 0;
let carrito = [];
let productList = [];

async function fetchProducts() {
    productList = await (await fetch("/api/products")).json();
    displayProducts()
}

// Modificar la función displayProductos para mostrar disponibilidad
function displayProducts() {
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


function add(productId, price) {
    const product = productList.find(p => p.id === productId);
    product.stock--;

    console.log(productId.price);
    carrito.push(productId);
    total = total + price;
    document.getElementById("checkout").innerHTML = `Pagar $${total}`;
    displayProducts();
}

async function pay() {
    try {
        const productList = await (await fetch("/api/pay", {
        method: "post",
        body: JSON.stringify(carrito),
        headers: {
            "Content-Type": "application/json"
        }
    })).json();
        
    } catch  {
        window.alert("Sin Stock");
        
    }
    total = 0;
        carrito = [];
    await fetchProducts
    document.getElementById("checkout").innerHTML = `Pagar $${total}`;

}

// Inicialización
window.onload = async () => {
    await fetchProducts();
    productList = await (await fetch("/api/products")).json();

    displayProducts()
}
