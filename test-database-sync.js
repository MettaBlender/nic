// Test Database Synchronization
async function testDatabaseSync() {
  try {
    console.log('🧪 Testing database synchronization...');

    // Test 1: Update Block Content via API
    const testContent = {
      text: "Test content from API call",
      timestamp: new Date().toISOString(),
      testProperty: "This is a test"
    };

    console.log('📤 Sending test content to update-block API...');
    console.log('Test content:', testContent);

    // Simuliere einen Block-Update
    const response = await fetch('http://localhost:3001/api/cms/update-block', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: JSON.stringify(testContent),
        id: 'test-block-id' // Das würde normalerweise eine echte Block-ID sein
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API response successful:', result);
    } else {
      const error = await response.json();
      console.log('❌ API response failed:', error);
    }

  } catch (error) {
    console.log('❌ Error testing database sync:', error.message);
  }
}

// Führe den Test aus
testDatabaseSync();
