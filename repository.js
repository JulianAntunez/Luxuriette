const { google } = require('googleapis');
require('dotenv').config({ override: false });


// Inicializa el cliente de Google Sheets
const sheets = google.sheets('v4');

const auth = new google.auth.GoogleAuth({
  keyFile: 'tiendaweb-466218-37373c242486.json', // Ruta al archivo JSON en la raíz del proyecto
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = process.env.SPREAD_SHEET_ID;
// const range = "Products!A:F"; // Asegúrate de que no haya espacios

// Autenticación utilizando el archivo JSON de claves de servicio


async function read(sheetName = "Productos", range = "A:I") {
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

    //console.log("Datos leídos:", resultRead.data.values);

    // Asegúrate de que hay datos antes de intentar procesarlos
    if (!resultRead.data.values || resultRead.data.values.length === 0) {
      console.log('No se encontraron datos en la hoja.');
      return [];
    }

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
    // console.log("Productos leídos:", products);
    return products;
  } catch (error) {
    console.error(`Error en lectura: ${error.message}`);
    return [];
  }
}

// Llama a la función read si es necesario

async function write(products) {
  try {
    const authClient = await auth.getClient();

    // Limpiar rango antes de escribir
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "Productos!A2:I",
      auth: authClient
    });

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

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: rangeWrite,
      auth: authClient
    });

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rangeWrite,
      valueInputOption: 'RAW',
      resource: { values },
      auth: authClient,
    });

    return { success: true, updatedCells: result.data.updatedCells };
  } catch (error) {
    console.error(`Error en escritura: ${error.message}`);
    return { success: false, error: error.message };
   }
}


module.exports = {
  read,
  write,
}

