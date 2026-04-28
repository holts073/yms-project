const db = require('better-sqlite3')('database.sqlite');
console.log(db.prepare("SELECT id, status, palletsExchanged, isPalletExchangeConfirmed FROM yms_deliveries ORDER BY registrationTime DESC LIMIT 5").all());
