import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
const VAULT_FILE_PATH = path.join(process.cwd(), 'data', 'secureVault.json');
const ALGORITHM = 'aes-256-cbc';

// !!! IMPORTANT SECURITY NOTE !!!
// In a production environment, the encryptionKey and iv should NEVER be hardcoded.
// They should be loaded from secure environment variables, a Hardware Security Module (HSM),
// or a dedicated secrets management service (e.g., HashiCorp Vault, AWS Secrets Manager, Google Cloud Secret Manager).
// For this MVP, we are using environment variables with fallback to hardcoded values for demonstration purposes ONLY.
// Ensure these variables are set in your environment for better security practice even in development.
//
// Example for generating a secure key and IV in Node.js:
// const encryptionKey = crypto.randomBytes(32); // 32 bytes for AES-256
// const iv = crypto.randomBytes(16);           // 16 bytes for AES-CBC
// console.log('Encryption Key (hex):', encryptionKey.toString('hex'));
// console.log('IV (hex):', iv.toString('hex'));
//
// Store these generated values securely.

const ENV_ENCRYPTION_KEY = process.env.MASSAFLOW_VAULT_KEY;
const ENV_IV = process.env.MASSAFLOW_VAULT_IV;

// Fallback to less secure hardcoded values if environment variables are not set (FOR MVP DEMONSTRATION ONLY)
const DEFAULT_ENCRYPTION_KEY_HEX = 'e1b5c7f2a9d3e8f6a7b3c5d9e0f1a3b8c5d7e9f0a2b6c8d4e7f1a0b9c3d5e7f2'; // Example 32-byte key
const DEFAULT_IV_HEX = 'f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5'; // Example 16-byte IV

if (!ENV_ENCRYPTION_KEY || !ENV_IV) {
  console.warn(
    'WARNING: MASSAFLOW_VAULT_KEY and/or MASSAFLOW_VAULT_IV environment variables are not set. ' +
    'Using default less secure hardcoded values for encryption. This is NOT recommended for production.'
  );
}

const encryptionKey = Buffer.from(ENV_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY_HEX, 'hex');
const iv = Buffer.from(ENV_IV || DEFAULT_IV_HEX, 'hex');

if (encryptionKey.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits) for aes-256-cbc. Please check MASSAFLOW_VAULT_KEY or the default key.');
}
if (iv.length !== 16) {
    throw new Error('Initialization Vector (IV) must be 16 bytes for aes-256-cbc. Please check MASSAFLOW_VAULT_IV or the default IV.');
}


// --- Utility Functions ---

/**
 * Reads the vault data from the JSON file.
 * Creates the directory and file if they don't exist.
 * @returns {object} The vault data object.
 */
function readVaultFile() {
  try {
    if (!fs.existsSync(path.dirname(VAULT_FILE_PATH))) {
      fs.mkdirSync(path.dirname(VAULT_FILE_PATH), { recursive: true });
    }
    if (!fs.existsSync(VAULT_FILE_PATH)) {
      fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify({}), 'utf-8');
      return {};
    }
    const data = fs.readFileSync(VAULT_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading or creating vault file:", error);
    // In a real app, might want to handle this more gracefully or throw a custom error
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify({}), 'utf-8'); // Attempt to reset if corrupt or missing
        return {};
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Writes the vault data to the JSON file.
 * @param {object} data The vault data object to write.
 */
function writeVaultFile(data) {
  try {
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing vault file:", error);
    throw error; // Re-throw
  }
}

// --- Encryption and Decryption Functions ---

/**
 * Encrypts a text string.
 * @param {string} text The text to encrypt.
 * @returns {string} The encrypted text (hex format).
 */
export function encrypt(text) {
  if (text === null || typeof text === 'undefined') {
    throw new Error("Text to encrypt cannot be null or undefined.");
  }
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Decrypts an encrypted text string.
 * @param {string} encryptedText The encrypted text (hex format).
 * @returns {string} The original decrypted text.
 */
export function decrypt(encryptedText) {
  if (encryptedText === null || typeof encryptedText === 'undefined') {
    throw new Error("Encrypted text to decrypt cannot be null or undefined.");
  }
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption failed. This could be due to an incorrect key/IV or corrupted data.", error);
    // In a production scenario, you might want to throw a custom error or return a specific value
    // indicating decryption failure without exposing too much detail.
    throw new Error("Decryption failed. The data may be corrupted or the key/IV may be incorrect.");
  }
}

// --- CRUD Operations for Secrets ---

/**
 * Stores a secret for a given user and service.
 * @param {string} userId The ID of the user.
 * @param {string} serviceName The name of the service (e.g., 'googleCalendar', 'whatsappApi').
 * @param {string} secretValue The secret value to store.
 */
export function storeSecret(userId, serviceName, secretValue) {
  if (!userId || !serviceName || typeof secretValue !== 'string') { // Allow empty string for secretValue
    throw new Error("userId, serviceName, and secretValue (string) are required to store a secret.");
  }
  const vault = readVaultFile();
  const encryptedSecret = encrypt(secretValue);

  if (!vault[userId]) {
    vault[userId] = {};
  }
  vault[userId][serviceName] = encryptedSecret;
  writeVaultFile(vault);
  console.log(`Secret stored for user ${userId}, service ${serviceName}.`);
}

/**
 * Retrieves a decrypted secret for a given user and service.
 * @param {string} userId The ID of the user.
 * @param {string} serviceName The name of the service.
 * @returns {string|null} The decrypted secret, or null if not found.
 */
export function getSecret(userId, serviceName) {
  if (!userId || !serviceName) {
    throw new Error("userId and serviceName are required to get a secret.");
  }
  const vault = readVaultFile();

  if (vault[userId] && vault[userId][serviceName]) {
    try {
      const decryptedSecret = decrypt(vault[userId][serviceName]);
      return decryptedSecret;
    } catch (error) {
      // Decryption error already logged in decrypt function
      console.error(`Error decrypting secret for user ${userId}, service ${serviceName}.`);
      return null; // Or rethrow custom error
    }
  }
  console.warn(`Secret not found for user ${userId}, service ${serviceName}.`);
  return null;
}

/**
 * Deletes a secret for a given user and service.
 * @param {string} userId The ID of the user.
 * @param {string} serviceName The name of the service.
 * @returns {boolean} True if the secret was deleted, false if not found.
 */
export function deleteSecret(userId, serviceName) {
  if (!userId || !serviceName) {
    throw new Error("userId and serviceName are required to delete a secret.");
  }
  const vault = readVaultFile();

  if (vault[userId] && vault[userId][serviceName]) {
    delete vault[userId][serviceName];
    // If the user has no more secrets, optionally delete the user entry
    if (Object.keys(vault[userId]).length === 0) {
      delete vault[userId];
    }
    writeVaultFile(vault);
    console.log(`Secret deleted for user ${userId}, service ${serviceName}.`);
    return true;
  }
  console.warn(`Secret not found for deletion for user ${userId}, service ${serviceName}.`);
  return false;
}

/**
 * Lists all services for which a user has stored secrets.
 * @param {string} userId The ID of the user.
 * @returns {string[]|null} An array of service names, or null if the user is not found.
 */
export function listServicesForUser(userId) {
    if (!userId) {
        throw new Error("userId is required to list services.");
    }
    const vault = readVaultFile();
    if (vault[userId]) {
        return Object.keys(vault[userId]);
    }
    console.warn(`No services found for user ${userId} or user does not exist.`);
    return null;
}
