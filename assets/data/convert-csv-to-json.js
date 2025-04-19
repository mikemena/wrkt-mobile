const fs = require('fs');
const Papa = require('papaparse');

// Function to convert CSV to JSON
function convertCsvToJson(csvFilePath, jsonFilePath) {
  const csvFile = fs.readFileSync(csvFilePath, 'utf8');

  Papa.parse(csvFile, {
    header: true,
    complete: results => {
      fs.writeFileSync(jsonFilePath, JSON.stringify(results.data, null, 2));
      console.log(`Converted ${csvFilePath} to ${jsonFilePath}`);
    }
  });
}

// Convert each CSV file to JSON
convertCsvToJson('equipment_catalog.csv', 'equipments.json');
convertCsvToJson('muscles.csv', 'muscles.json');
convertCsvToJson('exercises.csv', 'exercises.json');
