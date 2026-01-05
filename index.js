const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const repository = require('./repository.js');

const app = express();
// const port = 3000;
const port = process.env.PORT || 10000;

// --- MIDDLEWARES ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir archivos estáticos
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use("/", express.static("frontend"));

// --- RUTAS DE PRODUCTOS ---

// Obtener productos por categoría
app.get('/api/products/:type', async (req, res) => {
    const type = req.params.type;
    try {
        const products = await repository.read();
        const filteredProducts = products.filter(product => String(product.Tipo) === String(type));
        res.send(filteredProducts);
    } catch (error) {
        console.error('Error al obtener productos por tipo:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Obtener catálogo completo (para el carrito)
app.get('/api/all-products', async (req, res) => {
    try {
        const products = await repository.read();
        res.send(products);
    } catch (error) {
        res.status(500).send({ error: "Error al obtener catálogo completo" });
    }
});

// --- RUTA DE PAGO Y GESTIÓN DE STOCK ---

app.post('/api/pay', async (req, res) => {
    try {
        const carrito = req.body; // [{id, price, quantity, nombre}]

        if (!Array.isArray(carrito) || carrito.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // 1. Agrupar cantidades solicitadas por ID
        const cantidadPorProducto = {};
        carrito.forEach(item => {
            const id = item.id;
            const qty = item.quantity || 1;
            cantidadPorProducto[id] = (cantidadPorProducto[id] || 0) + qty;
        });

        // 2. Leer stock actual de la base de datos
        const productosMaster = await repository.read();

        // 3. Validar si hay stock suficiente
        const faltantes = [];
        for (const id in cantidadPorProducto) {
            const producto = productosMaster.find(p => Number(p.Id) === Number(id));
            
            if (!producto) {
                faltantes.push({ id, motivo: 'Producto no existe' });
            } else if (Number(producto.Stock) < cantidadPorProducto[id]) {
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

        // 4. Calcular totales y preparar actualización
        let totalVenta = 0;
        let nombresParaRegistro = [];
        let totalArticulos = 0;

        const productosActualizados = productosMaster.map(p => {
            const qtyComprada = cantidadPorProducto[p.Id] || 0;
            if (qtyComprada > 0) {
                totalVenta += (Number(p.Precio) * qtyComprada);
                totalArticulos += qtyComprada;
                // Formato con ID entre paréntesis
                nombresParaRegistro.push(`(${p.Id}) ${p.Producto} (x${qtyComprada})`);
                
                return { 
                    ...p, 
                    Stock: Number(p.Stock) - qtyComprada 
                };
            }
            return p;
        });

        // 5. ESCRIBIR EN GOOGLE SHEETS
        
        // A. Actualizar stock
        const resultadoStock = await repository.write(productosActualizados);
        if (!resultadoStock.success) {
            throw new Error(resultadoStock.error || "Error al escribir stock");
        }

        // B. Registrar Venta con ID único
        const idTransaccion = "MP-" + Date.now();
        const resumenVenta = {
            productos: nombresParaRegistro.join(", "),
            cantidad: totalArticulos,
            total: totalVenta
        };
        await repository.logVenta(resumenVenta);

        // 6. RESPUESTA ÚNICA EXITOSA
        return res.status(200).json({ 
            success: true, 
            idVenta: idTransaccion, 
            total: totalVenta 
        });

    } catch (error) {
        console.error('Error crítico en el proceso de pago:', error);
        
        // Evitamos enviar doble respuesta si hubo error después de enviar éxito
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Error interno del servidor al procesar el pago' });
        }
    }
});

// --- INICIO DEL SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});