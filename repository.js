const { google } = require('googleapis');
require('dotenv').config({ override: false});


// Inicializa el cliente de Google Sheets
const sheets = google.sheets('v4');

const auth = new google.auth.GoogleAuth({
  keyFile: 'tiendaweb-466218-37373c242486.json', // Ruta al archivo JSON en la raíz del proyecto
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = process.env.SPREAD_SHEET_ID;
const range = "Products!A:F"; // Asegúrate de que no haya espacios

// Autenticación utilizando el archivo JSON de claves de servicio


async function read(sheetName = "Products", range = "A:F") {
  try {
    const dynamicRange = `${sheetName}!${range}`;
    // Obtén el cliente autenticado
    const authClient = await auth.getClient();
    
    // Establece el cliente de autenticación en la API
     const resultRead = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: dynamicRange,
      auth: authClient,
    // const resultRead = await sheets.spreadsheets.values.get({
    //   spreadsheetId: spreadsheetId,
    //   range: range,
    //   auth: authClient,
    });

    // console.log("Datos leídos:", resultRead.data.values);
    
    // Asegúrate de que hay datos antes de intentar procesarlos
    if (!resultRead.data.values || resultRead.data.values.length === 0) {
      console.log('No se encontraron datos en la hoja.');
      return [];
    }

    const products = resultRead.data.values.slice(1).map((row) => ({
      ID: parseInt(row[0]),
      Producto: row[1],
      Descripcion: row[2],
      Precio: +row[3],
      Stock: parseInt(row[4]),
    Imagen: row[5],
    }));
    //  console.log("Productos leídos:", products);
    return products;
  } catch (error) {
    console.error(`Error en lectura: ${error.message}`);
    return [];
  }
}

// Llama a la función read si es necesario


async function write(products) {

//   try {
//     // Mapeo de productos a formato adecuado para Google Sheets
//     const values = products.map(p => [
//       p.ID, // Mantener el ID original
//       p.Producto,
//       p.Precio,
//       p.Stock
//     ]);

//     // Definir el rango de escritura comenzando desde la fila 2 para no sobrescribir el encabezado
//     const rangeForWrite = "Products!A2:D"; // Cambiar a A2 para no afectar el encabezado

//     // Definir opciones para la actualización
//     const valueInputOption = 'RAW'; // O 'USER_ENTERED', según lo que necesites

//     // Llamada a la función de actualización
//     const result = await googleSheets.write(spreadsheetId, rangeForWrite, values, valueInputOption);

//     // Validación de respuesta
//     if (!result || !result.data.updatedCells) {
//       throw new Error("No se actualizaron celdas en la hoja de cálculo");
//     }

//     return { success: true, updatedCells: result.data.updatedCells };
//   } catch (error) {
//     console.error(`Error en escritura: ${error.message}`);
//     return { 
//       success: false,
//       error: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     };
//   }
// }

};

// https://docs.google.com/spreadsheets/d/1tWUyVmwNKqnV6rQd_e_kovl2odjfruPO5V-NKZffe74/edit?usp=sharing


// async function readAndWrite() {
//     const products = await read();
//     // products[1].stock = 30;
//     // products[0].stock = 25;
//     await write(products);
    
// }

// readAndWrite();
read();
module.exports = {
    read,
    write,
}