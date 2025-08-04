let products = [];
let total = 0;


function add(productId, price) {
    console.log(productId, price);
    products.push(productId);
    total += price;
    document.getElementById("checkout").innerText = "Carrito $" + total;
}
function pay(){
    window.alert(products.join(", \n") + " - Total: $" + total);
}