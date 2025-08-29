// Test Script für @options Parsing
const fs = require('fs');
const path = require('path');

// Lese die Aaron.jsx Datei
const filePath = path.join(__dirname, 'src/components/nic/blocks/Aaron/Aaron.jsx');
const content = fs.readFileSync(filePath, 'utf-8');

console.log('=== Testing @options parsing ===');
console.log('File content:');
console.log(content);
console.log('\n=== Parsing Test ===');

// Verbesserte @options Parsing-Logik (kopiert aus route.js)
let options = {};

// Suche nach @options in den Kommentaren
const optionsMatch = content.match(/@options\s+(\{[\s\S]*?\})/);

console.log('Options match:', optionsMatch);

if (optionsMatch) {
  try {
    // Extrahiere das JSON-Objekt zwischen den geschweiften Klammern
    let optionsString = optionsMatch[1];

    console.log('Raw options string:', JSON.stringify(optionsString));

    // Entferne Kommentar-Syntax (Sterne und Leerzeichen am Zeilenanfang)
    optionsString = optionsString
      .split('\n')
      .map(line => {
        // Entferne führende Leerzeichen und Sterne
        return line.replace(/^\s*\*\s?/, '').trim();
      })
      .filter(line => line.length > 0) // Entferne leere Zeilen
      .join('\n')
      .trim();

    console.log('Cleaned options string:', JSON.stringify(optionsString));

    // Versuche zuerst normales JSON-Parsing
    try {
      options = JSON.parse(optionsString);
      console.log('✅ Successfully parsed options:', options);
    } catch (jsonError) {
      console.log('❌ Normal JSON parsing failed:', jsonError.message);

      // Fallback: Versuche relaxed JSON-Parsing (ohne Anführungszeichen um Property-Namen)
      try {
        // Ersetze unquoted property names mit quoted ones
        const relaxedJson = optionsString
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
          .replace(/,(\s*})/g, '$1'); // Entferne trailing commas

        console.log('Relaxed JSON string:', JSON.stringify(relaxedJson));

        options = JSON.parse(relaxedJson);
        console.log('✅ Successfully parsed relaxed options:', options);
      } catch (relaxedError) {
        console.log('⚠️  Failed to parse relaxed @options:', relaxedError.message);
        options = {};
      }
    }

  } catch (error) {
    console.log('⚠️  Failed to parse @options:', error.message);
    console.log('Raw options string was:', optionsMatch[1]);
    options = {};
  }
} else {
  console.log('❌ No @options found');
}

console.log('\nFinal options object:', options);
