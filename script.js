document.addEventListener('DOMContentLoaded', () => {
    const cart = [];
    const cartButton = document.getElementById('cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    const cartCount = document.getElementById('cart-count');

    function updateCart() {
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = `${item.name} - $${item.price}`;
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Eliminar';
            removeButton.onclick = () => {
                cart.splice(index, 1);
                updateCart();
            };
            li.appendChild(removeButton);
            cartItems.appendChild(li);
            total += item.price;
        });
        cartTotal.textContent = total;
        cartCount.textContent = cart.length;
    }

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));
            cart.push({ id: productId, name: productName, price: productPrice });
            updateCart();
        });
    });

    cartButton.onclick = () => {
        cartModal.style.display = 'block';
    };

    closeModal.onclick = () => {
        cartModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    };

    checkoutButton.onclick = () => {
        alert('Gracias por tu compra!');
        cart.length = 0;
        updateCart();
        cartModal.style.display = 'none';
    };
});
