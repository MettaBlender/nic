// Test Script für verbesserte @options Parsing
const fs = require('fs');
const path = require('path');

// Lese die Aaron.jsx Datei
const filePath = path.join(__dirname, 'src/components/nic/blocks/Aaron/Aaron.jsx');
const content = fs.readFileSync(filePath, 'utf-8');

console.log('=== Testing IMPROVED @options parsing ===');
console.log('File content:');
console.log(content);
console.log('\n=== Parsing Test ===');

// Verbesserte @options Parsing-Logik - Robuster Ansatz (kopiert aus route.js)
let options = {};

// Suche nach @options Block - erweiterte Regex für besseres Matching
const optionsRegex = /@options\s*\{([\s\S]*?)\}\s*(?=\*\/|\*\s*@|\*\s*$)/;
const optionsMatch = content.match(optionsRegex);

console.log('Options match result:', optionsMatch);

if (optionsMatch) {
  try {
    // Extrahiere den Inhalt zwischen den geschweiften Klammern
    let rawOptionsContent = optionsMatch[1];

    // Debug: Zeige den rohen Inhalt
    console.log(`📋 Raw @options content:`, JSON.stringify(rawOptionsContent));

    // Bereinige die Kommentar-Syntax systematisch
    let cleanedContent = rawOptionsContent
      // Normalisiere Zeilenendings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Entferne Kommentar-Asterisks und führende Leerzeichen
      .split('\n')
      .map(line => {
        // Entferne führende Leerzeichen und optional einen Stern
        return line.replace(/^\s*\*?\s*/, '').trim();
      })
      // Entferne komplett leere Zeilen
      .filter(line => line.length > 0)
      .join('\n')
      .trim();

    console.log(`🧹 Cleaned @options content:`, JSON.stringify(cleanedContent));

    // Baue valides JSON-Objekt zusammen
    let jsonString = `{${cleanedContent}}`;

    // Versuche zuerst direktes JSON-Parsing
    try {
      options = JSON.parse(jsonString);
      console.log(`✅ Direct JSON parsing successful:`, options);
    } catch (directError) {
      console.log(`⚠️  Direct parsing failed, trying relaxed parsing...`);
      console.log(`   Direct error:`, directError.message);

      // Fallback: Relaxed JSON-Parsing
      try {
        // Füge Anführungszeichen um unquoted Property-Namen hinzu
        let relaxedJson = jsonString
          // Property names ohne Anführungszeichen zu quoted names
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
          // Entferne trailing commas vor }
          .replace(/,(\s*})/g, '$1');

        console.log(`🔧 Relaxed JSON:`, relaxedJson);

        options = JSON.parse(relaxedJson);
        console.log(`✅ Relaxed JSON parsing successful:`, options);

      } catch (relaxedError) {
        console.warn(`❌ All parsing attempts failed`);
        console.warn(`   Direct error:`, directError.message);
        console.warn(`   Relaxed error:`, relaxedError.message);
        console.warn(`   Final JSON string:`, jsonString);
        options = {};
      }
    }

  } catch (generalError) {
    console.warn(`❌ General parsing error:`, generalError.message);
    options = {};
  }
} else {
  console.log(`ℹ️  No @options found`);
}

console.log('\n=== FINAL RESULT ===');
console.log('Final options object:', options);
