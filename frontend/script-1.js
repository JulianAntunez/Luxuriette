let productList = []
let carrito = [];
let total = 0;


function add(productId, price) {
const product = productList.find(p => p.id === productId);
            product.stock--;

    console.log(productId, price);
    carrito.push(productId);
    total += price;
    document.getElementById("checkout").innerHTML = " $ " + total;
    displayProducts();
}


async function pay() {
    try {
        // productList = await (await fetch("/api/pay", {
        //     method: 'post',
        //     body: JSON.stringify(carrito),
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        // })).json();
             // Realizar la solicitud POST al servidor
        const response = await fetch("/api/pay", {
            method: 'post',
            body: JSON.stringify(carrito),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        // Obtener la lista de productos actualizada
        productList = await response.json();

        // Vaciar el carrito y reiniciar el total
        carrito = [];
        total = 0;

        // Actualizar la lista de productos en la interfaz
        await fetchProducts();
        document.getElementById("checkout").innerHTML = "Carrito";

    }
    catch(error) {
        // Manejar errores
        console.error("Error al procesar el pago:", error);
        window.alert("No hay stock");
    }

    carrito = [];
    total = 0;
    await fetchProducts();
    // window.alert(products.join(", \n"));
}

function displayProducts() {
    let productsHTML = '';
    productList.forEach(p => {
        let buttonHTML = `<button class="button-add" onclick="add(${p.id}, ${p.price})">Agregar</button>`;

        if (p.stock <= 0) {
            buttonHTML = `<button disabled class="button-add-disabled" onclick="add(${p.id}, ${p.price})">Sin Stock</button>`;
        };
        productsHTML +=
            `<div class="product-container">
            <h3>${p.name}</h3>
            <img src="${p.image}" alt="">
            <h1>$ ${p.price}</h1>
            ${buttonHTML}
        </div>`
    });
    document.getElementById("page-content").innerHTML = productsHTML;
}

async function fetchProducts() {
    productList = await (await fetch("/api/products")).json(); 
     displayProducts();
}

window.onload = async () => {
    await fetchProducts();
}