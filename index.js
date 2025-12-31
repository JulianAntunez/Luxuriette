// SDK de Mercado Pago
// // import { MercadoPagoConfig, Preference } from 'mercadopago';
// Agrega credenciales
// const client = new MercadoPagoConfig({ accessToken: 'YOUR_ACCESS_TOKEN' });

const express = require('express');
const bodyParser = require('body-parser');
const repository = require('./repository.js');
const app = express();
const port = 3000;


const path = require('path');

// Servir archivos estáticos desde la carpeta "frontend"
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.get('/api/products/:type', async (req, res) => {
  const type = req.params.type; // Obtiene el tipo de producto
  try {
    const products = await repository.read(); // Lee todos los productos
    const filteredProducts = products.filter(product => product.Tipo === type); // Filtra por tipo
    res.send(filteredProducts);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Nueva ruta para obtener TODO sin filtrar
app.get('/api/all-products', async (req, res) => {
  try {
    const products = await repository.read();
    res.send(products);
  } catch (error) {
    res.status(500).send({ error: "Error al obtener catálogo completo" });
  }
});



// app.get('/api/products', async (req, res) => {
//   const sheetName = req.query.sheet || "Productos"; // Usa "Productos" por defecto
//   try {
//     const products = await repository.read(sheetName); // Asegúrate de que 'sheetName' sea "Productos"
//     res.send(products);
//   } catch (error) {
//     console.error('Error al obtener productos:', error);
//     res.status(500).json({ error: 'Error al obtener productos' });
//   }
// });


app.post('/api/pay', async (req, res) => {
  try {
    const carrito = req.body;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío o mal formado' });
    }

    // Normalizar IDs (acepta [1,2] o [{Id:1},{Id:2}])
    const cantidadPorProducto = {};
    carrito.forEach(item => {
      // Si recibimos {id: 1, quantity: 2}, sumamos la cantidad directamente
      const id = item.id;
      const qty = item.quantity || 1;
      cantidadPorProducto[id] = (cantidadPorProducto[id] || 0) + qty;
    });

    // Leer productos actuales
    const productos = await repository.read();

    // Validar stock antes de descontar
    const faltantes = [];
    for (const id in cantidadPorProducto) {
      const producto = productos.find(p => p.Id === parseInt(id));
      if (!producto) {
        faltantes.push({ id, motivo: 'Producto no existe' });
      } else if (producto.Stock < cantidadPorProducto[id]) {
        faltantes.push({
          id,
          producto: producto.Producto,
          disponible: producto.Stock,
          solicitado: cantidadPorProducto[id]
        });
      }
    }

    if (faltantes.length > 0) {
      return res.status(409).json({ error: 'Stock insuficiente', detalles: faltantes });
    }

    // Actualizar stock en memoria
    const productosActualizados = productos.map(p => {
      const qty = cantidadPorProducto[p.Id] || 0;
      return { ...p, Stock: p.Stock - qty };
    });

    // Escribir en la hoja
    const resultado = await repository.write(productosActualizados);
    if (!resultado.success) {
      throw new Error(resultado.error);
    }

    res.status(200).json(productosActualizados);
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



app.use("/", express.static("frontend"));

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
