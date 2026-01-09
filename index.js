const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const repository = require('./repository.js');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configura tus credenciales
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

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

// app.post('/api/pay', async (req, res) => {
//     try {
//         const carrito = req.body; // [{id, price, quantity, nombre}]

//         if (!Array.isArray(carrito) || carrito.length === 0) {
//             return res.status(400).json({ error: 'El carrito está vacío' });
//         }

//         // 1. Agrupar cantidades solicitadas por ID
//         const cantidadPorProducto = {};
//         carrito.forEach(item => {
//             const id = item.id;
//             const qty = item.quantity || 1;
//             cantidadPorProducto[id] = (cantidadPorProducto[id] || 0) + qty;
//         });

//         // 2. Leer stock actual de la base de datos
//         const productosMaster = await repository.read();

//         // 3. Validar si hay stock suficiente
//         const faltantes = [];
//         for (const id in cantidadPorProducto) {
//             const producto = productosMaster.find(p => Number(p.Id) === Number(id));

//             if (!producto) {
//                 faltantes.push({ id, motivo: 'Producto no existe' });
//             } else if (Number(producto.Stock) < cantidadPorProducto[id]) {
//                 faltantes.push({
//                     id,
//                     producto: producto.Producto,
//                     disponible: producto.Stock,
//                     solicitado: cantidadPorProducto[id]
//                 });
//             }
//         }

//         if (faltantes.length > 0) {
//             return res.status(409).json({ error: 'Stock insuficiente', detalles: faltantes });
//         }

//         // 4. Calcular totales y preparar actualización
//         let totalVenta = 0;
//         let nombresParaRegistro = [];
//         let totalArticulos = 0;

//         const productosActualizados = productosMaster.map(p => {
//             const qtyComprada = cantidadPorProducto[p.Id] || 0;
//             if (qtyComprada > 0) {
//                 totalVenta += (Number(p.Precio) * qtyComprada);
//                 totalArticulos += qtyComprada;
//                 // Formato con ID entre paréntesis
//                 nombresParaRegistro.push(`(${p.Id}) ${p.Producto} (x${qtyComprada})`);

//                 return {
//                     ...p,
//                     Stock: Number(p.Stock) - qtyComprada
//                 };
//             }
//             return p;
//         });

//         // 5. ESCRIBIR EN GOOGLE SHEETS

//         // A. Actualizar stock
//         const resultadoStock = await repository.write(productosActualizados);
//         if (!resultadoStock.success) {
//             throw new Error(resultadoStock.error || "Error al escribir stock");
//         }

//         // B. Registrar Venta con ID único

//         const idTransaccion = "MP-" + Date.now();
//         const resumenVenta = {
//             id: idTransaccion, // <-- Agregamos el ID aquí
//             productos: nombresParaRegistro.join(", "),
//             cantidad: totalArticulos,
//             total: totalVenta
//         };
//         await repository.logVenta(resumenVenta);

//         // 6. RESPUESTA ÚNICA EXITOSA
//         return res.status(200).json({
//             success: true,
//             idVenta: idTransaccion,
//             total: totalVenta
//         });

//     } catch (error) {
//         console.error('Error crítico en el proceso de pago:', error);

//         // Evitamos enviar doble respuesta si hubo error después de enviar éxito
//         if (!res.headersSent) {
//             return res.status(500).json({ error: 'Error interno del servidor al procesar el pago' });
//         }
//     }
// });
app.post('/api/pay', async (req, res) => {
    try {
        const carrito = req.body; // [{id, price, quantity, nombre}]

        if (!Array.isArray(carrito) || carrito.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // --- 1. VALIDACIÓN DE STOCK (Tu lógica original) ---
        const cantidadPorProducto = {};
        carrito.forEach(item => {
            const id = item.id;
            const qty = item.quantity || 1;
            cantidadPorProducto[id] = (cantidadPorProducto[id] || 0) + qty;
        });

        const productosMaster = await repository.read();
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

        // --- 2. CÁLCULO DE TOTALES PARA MERCADO PAGO ---
        const idVentaUnico = "MP-" + Date.now();

        // --- 3. CREACIÓN DE LA PREFERENCIA ---
        const preference = new Preference(client);

        const body = {
            items: carrito.map(item => ({
                id: String(item.id),
                title: item.nombre,
                quantity: Number(item.quantity),
                unit_price: Number(item.price),
                currency_id: 'ARS'
            })),
            back_urls: {
                // Cambia estas URLs por las de tu dominio real cuando lo subas
                success: `${req.protocol}://${req.get('host')}/success.html`,
                failure: `${req.protocol}://${req.get('host')}/index.html`,
                pending: `${req.protocol}://${req.get('host')}/pending.html`,
            },
            auto_return: "approved",
            // IMPORTANTE: Guardamos todo el pedido para usarlo después del pago
            external_reference: JSON.stringify({
                idVenta: idVentaUnico,
                items: carrito
            })
        };

        const response = await preference.create({ body });

        // --- 4. RESPUESTA AL FRONTEND ---
        // Aquí no descontamos stock aún, solo enviamos el ID para abrir el modal
        res.status(200).json({ 
            preferenceId: response.id,
            idVenta: idVentaUnico 
        });

    } catch (error) {
        console.error('Error crítico al crear preferencia:', error);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Error interno al procesar el pago' });
        }
    }
});

// Ruta para recibir la confirmación de pago de Mercado Pago
app.post('/webhook', async (req, res) => {
    const { query } = req;
    const topic = query.topic || query.type;

    try {
        if (topic === "payment") {
            const paymentId = query.id || query['data.id'];
            
            // 1. Consultar el estado del pago a Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const payment = await response.json();

            if (payment.status === "approved") {
                // 2. Recuperar los datos que guardamos en external_reference
                const dataExtra = JSON.parse(payment.external_reference);
                const carrito = dataExtra.items;

                // 3. ACTUALIZAR GOOGLE SHEETS (Tu lógica original)
                const productosMaster = await repository.read();
                let totalVenta = 0;
                let nombresParaRegistro = [];
                let totalArticulos = 0;

                const productosActualizados = productosMaster.map(p => {
                    const itemComprado = carrito.find(i => Number(i.id) === Number(p.Id));
                    if (itemComprado) {
                        const qty = itemComprado.quantity || 1;
                        totalVenta += (Number(p.Precio) * qty);
                        totalArticulos += qty;
                        nombresParaRegistro.push(`(${p.Id}) ${p.Producto} (x${qty})`);
                        return { ...p, Stock: Number(p.Stock) - qty };
                    }
                    return p;
                });

                // A. Escribir stock
                await repository.write(productosActualizados);

                // B. Registrar venta
                await repository.logVenta({
                    id: dataExtra.idVenta,
                    productos: nombresParaRegistro.join(", "),
                    cantidad: totalArticulos,
                    total: totalVenta
                });

                console.log(`✅ Venta ${dataExtra.idVenta} procesada con éxito.`);
            }
        }
        // Mercado Pago necesita un 200 o 201 para dejar de enviar notificaciones
        res.sendStatus(200);
    } catch (error) {
        console.error("Error en el Webhook:", error);
        res.sendStatus(500);
    }
});
// --- INICIO DEL SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});