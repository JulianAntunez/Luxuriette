const express = require('express');
const bodyParser = require('body-parser')
const repository = require("./repository")
const app = express();
const PORT = process.env.PORT || 5100;


// Middleware to parse JSON requests
// app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Define a basic route
app.post("/api/pay", async (req, res) => {
    const ids = req.body;
    const productsCopy = products.map(p => ({...p}));

    ids.forEach(id => {
        const product =  productsCopy.find(p => p.id === id)
        if (product.stock > 0) {
            product.stock --; 
        }
        else{
            throw "Sin Stock";
        };
        
    });
    products =  productsCopy;
    res.send(products);
});

app.get('/api/products', async (req, res) => {
    try {
        const sheetName = req.query.sheetName || "Products";
        const range = req.query.range || "A:F"; // Rango por defecto
        const products = await repository.read(sheetName, range);
     res.send(products);
    console.log("Productos enviados al cliente:", products);
  } catch (error) {
    res.status(500).send({ error: 'Error al obtener los productos' });
  }
});

app.get('/api/juguetes', async (req, res) => {
    try {
        const sheetName = req.query.sheetName || "Juguetes";
        const range = req.query.range || "A:F"; // Rango por defecto
        const products = await repository.read(sheetName, range);
     res.send(products);
    console.log("Productos enviados al cliente:", products);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener los productos' });
    }
});
// Endpoint extendido para pagar
// app.post("/api/pay", async (req, res) => {
//     const ids = req.body;
//     const productsCopy = await repository.read();

//     let error = false;

//     ids.forEach((producto_id) => {
//         const product = productsCopy.find((p) => p.producto_id === producto_id);
//         if (product.stock > 0) {
//             product.stock--;
//         } else {
//             error = true;
//         }
//     });
//     if (error) {
//         res.send("Sin Stock").statusCode(400);
//     } else {
//         await repository.write(productsCopy);
//         res.send(productsCopy)

//     }

// });


// Define another route
app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the API!' });
});

app.use("/", express.static("frontend"));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} *-*--/--*-*`);
    // console.log(`Server On-Line Port: ${PORT}`);
});
exports = app; // Export the app for testing or further use