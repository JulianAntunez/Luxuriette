const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let products = [
    {
        id: 1,
        name: 'Product 1',
        price: 100,
        image: './img/producto1.jpg"',
        stock: 3
    },
    {
        id: 2,
        name: 'Product 2',
        price: 105,
        image: './img/producto2.jpg"',
        stock: 5
    },
    {
        id: 3,
        name: 'Product 3',
        price: 100,
        image: '/img/producto3.jpg"',
        stock: 5
    },
    {
        id: 4,
        name: 'Product 4',
        price: 100,
        image: './img/producto1.jpg"',
        stock: 5
    },
    {
        id: 5,
        name: 'Product 5',
        price: 100,
        image: './img/producto2.jpg"',
        stock: 5
    },
    {
        id: 6,
        name: 'Product 6',
        price: 100,
        image: './img/producto3.jpg"',
        stock: 5
    },
    {
        id: 7,
        name: 'Product 7',
        price: 100,
        image: './img/producto1.jpg"',
        stock: 5
    }
];

app.get('/api/products', (req, res) => {
    res.send(products);
})

// app.post('/api/pay', (req, res) => {
//     const ids = req.body;
//     let productsCopy = products.map(p => ({ ...p })); // Create a copy of products to avoid modifying the original array

//     ids.forEach(id => {
//         const product = productsCopy.find(p => p.id === id);// If product not found, skip
//         if (product.stock > 0) {// If no stock, skip
//             product.stock -= 1;
//         }
//         else {
//             throw (`No stock for product with id ${id}`);
//         }
//     });
//     products = productsCopy;
//     res.send(products);
// });

app.post('/api/pay', (req, res) => {
    let ids = req.body;

    // Crear copia de productos
    let productsCopy = products.map(p => ({ ...p }));

    try {
       ids.forEach(id => {
        let product = productsCopy.find(p => p.id === id);// If product not found, skip
        if (product.stock > 0) {// If no stock, skip
            product.stock -= 1;
        }
        else {
            throw (`No stock for product with id ${id}`);
        }
    });
    products = productsCopy;
    res.send(products);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.use("/", express.static("frontend"));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})