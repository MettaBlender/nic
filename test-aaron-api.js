// Test API Response für Aaron-Komponente
const fs = require('fs');

// Versuche die API direkt zu laden
const fetch = require('node-fetch').default || require('node-fetch');

async function testAaronComponent() {
    try {
        console.log('🔍 Testing Aaron component from API...');

        const response = await fetch('http://localhost:3001/api/cms/components');
        const data = await response.json();

        console.log('✅ API Response received');
        console.log('Success:', data.success);
        console.log('Available categories:', Object.keys(data.categories));

        // Schaue nach der Aaron-Kategorie
        const aaronCategory = data.categories.Aaron;

        if (aaronCategory && aaronCategory.length > 0) {
            console.log('\n📋 Aaron Category found with', aaronCategory.length, 'components:');

            aaronCategory.forEach((component, index) => {
                console.log(`\n🧩 Component ${index + 1}:`);
                console.log('  Name:', component.name);
                console.log('  File:', component.file);
                console.log('  Description:', component.description);
                console.log('  Icon:', component.icon);
                console.log('  Dimensions:', `${component.width}x${component.height}`);
                console.log('  Options:', JSON.stringify(component.options, null, 4));

                if (component.options && Object.keys(component.options).length > 0) {
                    console.log('  ✅ Has options!');
                    if (component.options.text) {
                        console.log('  📝 Text option:', component.options.text);
                    }
                } else {
                    console.log('  ❌ No options found');
                }
            });
        } else {
            console.log('❌ Aaron category not found or empty');
            console.log('Available categories:', Object.keys(data.categories));
        }

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

// Führe den Test aus
testAaronComponent();
