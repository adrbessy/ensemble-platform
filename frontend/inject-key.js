const fs = require('fs');
const path = './src/index.html';
const key = process.env.GOOGLE_MAPS_API_KEY;

if (!key) {
  console.error('❌ GOOGLE_MAPS_API_KEY non définie');
  process.exit(1);
}

fs.readFile(path, 'utf8', (err, data) => {
  if (err) throw err;

  const updated = data.replace(
    '__GOOGLE_MAPS_API_KEY__',
    key
  );

  fs.writeFile(path, updated, 'utf8', (err) => {
    if (err) throw err;
    console.log('✅ Clé Google Maps injectée dans index.html');
  });
});
