const fs = require('fs');
const path = require('path');

// Target the file inside your server directory
const filePath = path.join(__dirname, 'database_backup.sql');

if (!fs.existsSync(filePath)) {
    console.error(`Could not find file at: ${filePath}. Make sure it is in the server folder!`);
    process.exit(1);
}

console.log('Reading database_backup.sql...');
let sql = fs.readFileSync(filePath, 'utf8');

console.log('Converting double quotes (") to backticks (`) for MariaDB...');
// This replaces double quotes around names while leaving text strings intact
sql = sql.replace(/"([^"\n]+)"/g, '`$1`');

fs.writeFileSync(filePath, sql, 'utf8');
console.log('Success! Your database_backup.sql has been updated with clean backticks.');