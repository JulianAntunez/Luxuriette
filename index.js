const express = require('express')
const bodyParser = require('body-parser');
const repository = require('./repository.js');
const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/api/products', async (req, res) => {
    res.send(await repository.read());
})

app.post('/api/pay', async (req, res) => {
    let ids = req.body;

    // Crear copia de productos
    let productsCopy = await repository.read();

    let error = false;

    ids.forEach(id => {
        let product = productsCopy.find(p => p.id === id);// If product not found, skip
        if (product.Stock > 0) {// If no Stock, skip
            product.Stock -= 1;
        }
        else {
            error = true;
        }
    });

    if (error) {
        res.send("No hay Stock").statusCode(400);
        return;
    } else {
        await repository.write(productsCopy);
     
        res.send(productsCopy);
    }
});

app.use("/", express.static("frontend"));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})