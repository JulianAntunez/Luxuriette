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

app.post('/api/pay', async (req, res) => {
    try {
        const carrito = req.body;

        if (!Array.isArray(carrito) || carrito.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // 1. VALIDACIÓN DE STOCK
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

        // 2. CREACIÓN DE LA PREFERENCIA
        const idVentaUnico = "MP-" + Date.now();
        const preference = new Preference(client);

        const body = {
            items: carrito.map(item => ({
                id: String(item.id),
                title: String(item.nombre).substring(0, 250), // MP limita a 256 caracteres
                quantity: Number(item.quantity),
                unit_price: Number(item.price),
                currency_id: 'ARS'
            })),
            back_urls: {
                // USAMOS URLS MANUALES CON HTTPS PARA EVITAR EL ERROR invalid_auto_return
                success: "https://luxuriette.onrender.com/success.html",
                failure: "https://luxuriette.onrender.com/index.html",
                pending: "https://luxuriette.onrender.com/index.html",
            },
            auto_return: "approved",
            external_reference: JSON.stringify({
                idVenta: idVentaUnico,
                items: carrito
            })
        };

        const response = await preference.create({ body });

        res.status(200).json({ 
            preferenceId: response.id,
            idVenta: idVentaUnico 
        });

    } catch (error) {
        console.error('--- ERROR EN MERCADO PAGO ---');
        // Esto captura el error específico que devuelve la API de MP
        if (error.apiResponse && error.apiResponse.body) {
            console.error('Detalle técnico:', JSON.stringify(error.apiResponse.body, null, 2));
        } else {
            console.error('Mensaje:', error.message);
        }

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