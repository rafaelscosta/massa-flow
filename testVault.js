import { storeSecret, getSecret, deleteSecret, listServicesForUser } from './lib/vault.js';

// --- Test Script ---

async function runVaultTests() {
  console.log("--- Starting Vault Test Script ---");

  const testUserId1 = 'userTest123';
  const testService1 = 'myTestService';
  const testSecret1 = 'ThisIsASuperSecretToken!@#$%^';

  const testUserId2 = 'userTest456';
  const testService2Google = 'googleCalendar';
  const testSecret2Google = 'oauth_token_for_google_user456';
  const testService2Whatsapp = 'whatsappApi';
  const testSecret2Whatsapp = 'api_key_for_whatsapp_user456';


  // --- Test Case 1: Store and Retrieve a single secret ---
  console.log(`\n[Test Case 1] Storing secret for ${testUserId1}, service ${testService1}...`);
  storeSecret(testUserId1, testService1, testSecret1);

  console.log(`Retrieving secret for ${testUserId1}, service ${testService1}...`);
  const retrievedSecret1 = getSecret(testUserId1, testService1);

  if (retrievedSecret1 === testSecret1) {
    console.log(`SUCCESS: Retrieved secret matches original for ${testUserId1}/${testService1}. Value: "${retrievedSecret1}"`);
  } else {
    console.error(`FAILURE: Retrieved secret does NOT match original for ${testUserId1}/${testService1}. Expected: "${testSecret1}", Got: "${retrievedSecret1}"`);
  }

  // --- Test Case 2: Store multiple secrets for a different user ---
  console.log(`\n[Test Case 2] Storing secrets for ${testUserId2}...`);
  storeSecret(testUserId2, testService2Google, testSecret2Google);
  storeSecret(testUserId2, testService2Whatsapp, testSecret2Whatsapp);

  console.log(`Retrieving Google secret for ${testUserId2}...`);
  const retrievedSecret2Google = getSecret(testUserId2, testService2Google);
  if (retrievedSecret2Google === testSecret2Google) {
    console.log(`SUCCESS: Retrieved Google secret matches original for ${testUserId2}. Value: "${retrievedSecret2Google}"`);
  } else {
    console.error(`FAILURE: Retrieved Google secret does NOT match original for ${testUserId2}.`);
  }

  console.log(`Retrieving WhatsApp secret for ${testUserId2}...`);
  const retrievedSecret2Whatsapp = getSecret(testUserId2, testService2Whatsapp);
  if (retrievedSecret2Whatsapp === testSecret2Whatsapp) {
    console.log(`SUCCESS: Retrieved WhatsApp secret matches original for ${testUserId2}. Value: "${retrievedSecret2Whatsapp}"`);
  } else {
    console.error(`FAILURE: Retrieved WhatsApp secret does NOT match original for ${testUserId2}.`);
  }

  // --- Test Case 3: List services for a user ---
  console.log(`\n[Test Case 3] Listing services for ${testUserId2}...`);
  const servicesUser2 = listServicesForUser(testUserId2);
  if (servicesUser2 && servicesUser2.includes(testService2Google) && servicesUser2.includes(testService2Whatsapp)) {
    console.log(`SUCCESS: Services for ${testUserId2}: ${servicesUser2.join(', ')}`);
  } else {
    console.error(`FAILURE: Could not correctly list services for ${testUserId2}. Got: ${servicesUser2}`);
  }
  
  console.log(`Listing services for non-existent user 'nonExistentUser99'...`);
  const servicesNonExistent = listServicesForUser('nonExistentUser99');
  if (servicesNonExistent === null) {
    console.log(`SUCCESS: listServicesForUser returned null for non-existent user, as expected.`);
  } else {
    console.error(`FAILURE: listServicesForUser should return null for non-existent user. Got: ${servicesNonExistent}`);
  }


  // --- Test Case 4: Delete a secret and verify ---
  console.log(`\n[Test Case 4] Deleting secret for ${testUserId1}, service ${testService1}...`);
  const deleteResult1 = deleteSecret(testUserId1, testService1);
  if (deleteResult1) {
    console.log(`SUCCESS: Secret deletion reported for ${testUserId1}/${testService1}.`);
  } else {
    console.error(`FAILURE: Secret deletion failed to report for ${testUserId1}/${testService1}.`);
  }

  console.log(`Attempting to retrieve deleted secret for ${testUserId1}/${testService1}...`);
  const retrievedAfterDelete1 = getSecret(testUserId1, testService1);
  if (retrievedAfterDelete1 === null) {
    console.log(`SUCCESS: Secret for ${testUserId1}/${testService1} is null after deletion, as expected.`);
  } else {
    console.error(`FAILURE: Secret for ${testUserId1}/${testService1} was found after deletion. Value: "${retrievedAfterDelete1}"`);
  }
  
  // Verify user1 is removed from vault if no more secrets
  const servicesUser1AfterDelete = listServicesForUser(testUserId1);
   if (servicesUser1AfterDelete === null) {
    console.log(`SUCCESS: User ${testUserId1} has no more services listed and might be removed from vault, as expected.`);
  } else {
    console.error(`FAILURE: User ${testUserId1} still has services listed: ${servicesUser1AfterDelete}`);
  }

  // --- Test Case 5: Attempt to retrieve non-existent secret ---
  console.log(`\n[Test Case 5] Attempting to retrieve non-existent secret for ${testUserId2}, service 'nonExistentService'...`);
  const nonExistentSecret = getSecret(testUserId2, 'nonExistentService');
  if (nonExistentSecret === null) {
    console.log(`SUCCESS: Retrieval of non-existent secret returned null, as expected.`);
  } else {
    console.error(`FAILURE: Retrieval of non-existent secret returned a value: "${nonExistentSecret}"`);
  }

  // --- Test Case 6: Delete one secret from a user with multiple, then list ---
  console.log(`\n[Test Case 6] Deleting Google secret for ${testUserId2}...`);
  deleteSecret(testUserId2, testService2Google);
  const servicesUser2AfterPartialDelete = listServicesForUser(testUserId2);
  if (servicesUser2AfterPartialDelete && servicesUser2AfterPartialDelete.length === 1 && servicesUser2AfterPartialDelete[0] === testService2Whatsapp) {
    console.log(`SUCCESS: User ${testUserId2} now only has service '${testService2Whatsapp}' listed.`);
  } else {
    console.error(`FAILURE: Service listing for ${testUserId2} after partial delete is incorrect. Got: ${servicesUser2AfterPartialDelete}`);
  }


  // --- Test Case 7: Error Handling (optional, more advanced for MVP) ---
  // Example: Trying to encrypt null (already handled in encrypt function)
  try {
    console.log("\n[Test Case 7] Testing error handling by trying to store null secret...");
    // This will actually throw in storeSecret due to validation, or in encrypt if validation was looser
    storeSecret('errorUser', 'errorService', null); 
  } catch (e) {
    console.log(`SUCCESS: Caught expected error when trying to store null secret: "${e.message}"`);
  }
  
  // Clean up remaining test data
  console.log("\nCleaning up remaining test data...");
  deleteSecret(testUserId2, testService2Whatsapp); // Should remove userTest456 completely

  console.log("\n--- Vault Test Script Finished ---");
  console.log("\nCheck 'data/secureVault.json' to see the encrypted data structure (it should be empty or contain only non-test data if any existed before).");
  console.log("During the test, it's populated and then cleaned up.");
  console.log("\nTo test with environment variables for KEY and IV, set MASSAFLOW_VAULT_KEY and MASSAFLOW_VAULT_IV before running.");
  console.log("Example (ensure these are 32-byte and 16-byte hex strings respectively):");
  console.log("export MASSAFLOW_VAULT_KEY='your_32_byte_hex_key_here'");
  console.log("export MASSAFLOW_VAULT_IV='your_16_byte_hex_iv_here'");

}

runVaultTests();
