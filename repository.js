const { google } = require('googleapis');
require('dotenv').config({ override: false });

// Inicializa el cliente de Google Sheets
const sheets = google.sheets('v4');

// --- CAMBIO CLAVE PARA RENDER ---
// Usamos las credenciales directamente desde las variables de entorno
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // El replace ayuda a procesar correctamente los saltos de línea de la clave privada
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// const spreadsheetId = "1wihpFZbKGo4gBsMgmSDur8HbgUO6P8cW3ftNbcHEQG4";
const spreadsheetId = process.env.SPREAD_SHEET_ID;
// console.log("El ID cargado es:", spreadsheetId); // <--- AGREGA ESTA LÍNEA


/**
 * Lee los productos de la hoja "Productos"
 */
async function read(sheetName = "Productos", range = "A:I") {
  try {
    const dynamicRange = `${sheetName}!${range}`;
    const authClient = await auth.getClient();

    const resultRead = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: dynamicRange,
      auth: authClient,
    });

    if (!resultRead.data.values || resultRead.data.values.length === 0) {
      console.log('No se encontraron datos en la hoja.');
      return [];
    }

    // Mapeamos las filas a objetos JSON
    const products = resultRead.data.values.slice(1).map((row) => ({
      Id: parseInt(row[0]),
      Producto: row[1],
      Descripcion: row[2],
      Precio: parseFloat(String(row[3]).replace(/[^0-9.-]+/g, "")) || 0,
      Stock: parseInt(row[4]),
      Img1: row[5],
      Img2: row[6],
      Img3: row[7],
      Tipo: row[8],
    }));

    return products;
  } catch (error) {
    console.error(`Error en lectura: ${error.message}`);
    return [];
  }
}

/**
 * Sobrescribe el stock en la hoja "Productos"
 */
async function write(products) {
  try {
    const authClient = await auth.getClient();
    const sheetName = "Productos";
    const rangeWrite = `${sheetName}!A2:I`; 

    const values = products.map(p => [
      p.Id,
      p.Producto,
      p.Descripcion,
      p.Precio,
      p.Stock,
      p.Img1,
      p.Img2 || "",
      p.Img3 || "",
      p.Tipo || ""
    ]);

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: rangeWrite,
      valueInputOption: 'RAW',
      requestBody: { values }, 
      auth: authClient,
    });

    console.log(`Stock actualizado. Celdas afectadas: ${result.data.updatedCells}`);
    return { success: true, updatedCells: result.data.updatedCells };
  } catch (error) {
    console.error(`Error en escritura de stock: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Registra una nueva fila en la hoja "Ventas"
 */
// async function logVenta(datos) {
//   try {
//     const authClient = await auth.getClient();
    
//     const values = [[
//       "MP-" + Date.now(), 
//       new Date().toLocaleString('es-AR'), 
//       datos.productos,
//       datos.cantidad,
//       "Mercado Pago",
//       datos.total
//     ]];

//     const result = await sheets.spreadsheets.values.append({
//       spreadsheetId: spreadsheetId,
//       range: "Ventas!A:F",
//       valueInputOption: 'RAW',
//       requestBody: { values },
//       auth: authClient,
//     });

//     console.log("Venta registrada exitosamente en historial.");
//     return { success: true };
//   } catch (error) {
//     console.error("Error en logVenta:", error.message);
//     return { success: false, error: error.message };
//   }
// }
async function logVenta(datos) {
  try {
    const authClient = await auth.getClient();
    
    const values = [[
      datos.id || ("MP-" + Date.now()), // Usa el ID que viene del servidor o genera uno si no hay
      new Date().toLocaleString('es-AR'), 
      datos.productos,
      datos.cantidad,
      "Mercado Pago",
      datos.total
    ]];

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: "Ventas!A:F", // Asegúrate que la hoja se llame exactamente "Ventas"
      valueInputOption: 'RAW',
      requestBody: { values },
      auth: authClient,
    });

    console.log("Venta registrada exitosamente en historial.");
    return { success: true };
  } catch (error) {
    console.error("Error en logVenta:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  read,
  write,
  logVenta
};

