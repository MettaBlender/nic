// Test the current API state
fetch('http://localhost:3001/api/cms/components')
  .then(r => r.json())
  .then(data => {
    console.log('=== API Response Analysis ===');
    console.log('Success:', data.success);
    console.log('Available categories:', Object.keys(data.categories || {}));

    const aaron = data.categories?.Aaron?.[0];
    console.log('\n=== Aaron Component ===');
    console.log('Aaron component found:', !!aaron);

    if (aaron) {
      console.log('✅ Aaron component details:');
      console.log('- Name:', aaron.name);
      console.log('- File:', aaron.file);
      console.log('- Description:', aaron.description);
      console.log('- Icon:', aaron.icon);
      console.log('- Width:', aaron.width);
      console.log('- Height:', aaron.height);
      console.log('- Options:', JSON.stringify(aaron.options, null, 2));

      if (aaron.options && Object.keys(aaron.options).length > 0) {
        console.log('🎯 OPTIONS FOUND!');
        console.log('Options keys:', Object.keys(aaron.options));
        if (aaron.options.text) {
          console.log('📝 Text option value:', aaron.options.text);
        }
      } else {
        console.log('❌ No options found - this is the problem');
      }
    } else {
      console.log('❌ Aaron component not found');

      // Show all available components for debugging
      Object.entries(data.categories || {}).forEach(([cat, comps]) => {
        console.log(`\n📁 Category: ${cat}`);
        comps.forEach(comp => {
          console.log(`  - ${comp.name} (${comp.file})`);
        });
      });
    }
  })
  .catch(e => {
    console.log('❌ Error testing API:', e.message);
  });
