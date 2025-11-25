
const fs = require('fs');

if (fs.statfs) {
    console.log('fs.statfs is available');
    fs.statfs('/', (err, stats) => {
        if (err) {
            console.error('Error calling statfs:', err);
        } else {
            console.log('Stats for /:', stats);
        }
    });
} else {
    console.log('fs.statfs is NOT available');
}
