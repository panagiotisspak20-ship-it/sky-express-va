const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const outputPath = path.join(__dirname, 'src', 'renderer', 'src', 'assets', 'worldAirports.json');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const lines = data.split('\n');
    const result = {};
    for (let i = 1; i < lines.length; i++) {
        // use an extremely simple CSV split (since we only care about columns 1,3,4,5, which generally don't hold commas)
        // Actually name might hold commas. So a regex is better.
        // Let's just match comma outside quotes:
        const p = lines[i].split(',');
        // the csv columns:
        // 0: id
        // 1: ident (ICAO)
        // 2: type
        // 3: name
        // 4: latitude_deg
        // 5: longitude_deg
        
        // simple parsing
        const row = lines[i];
        let parts = [];
        let inQuotes = false;
        let currentString = '';
        for(let c=0; c<row.length; c++) {
            if(row[c] === '"') {
                inQuotes = !inQuotes;
            } else if(row[c] === ',' && !inQuotes) {
                parts.push(currentString);
                currentString = '';
            } else {
                currentString += row[c];
            }
        }
        parts.push(currentString);

        if (parts.length > 5 && parts[1] && parts[4] && parts[5]) {
            const icao = parts[1].trim();
            const name = parts[3] ? parts[3].trim() : '';
            const lat = parseFloat(parts[4]);
            const lng = parseFloat(parts[5]);
            // only get actual icao codes
            if (icao && icao.length === 4 && icao.match(/^[A-Z]{4}$/i) && !isNaN(lat) && !isNaN(lng)) {
                result[icao.toUpperCase()] = { name, lat, lng };
            }
        }
    }
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result));
    console.log('Saved ' + Object.keys(result).length + ' airports');
  });
}).on('error', (err) => {
  console.error(err.message);
});
