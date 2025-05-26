import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // To handle __dirname in ES modules
import logger from '../lib/logger.js'; // Adjust path based on actual structure
import { saveAllDynamicData as flushMemoryToDisk } from '../lib/db.js'; // Ensure this path is correct

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..'); // Assumes scripts/ is one level down from project root
const DYNAMIC_DATA_DIR = path.join(PROJECT_ROOT, 'data', 'dynamic');
const VAULT_FILE = path.join(PROJECT_ROOT, 'data', 'secureVault.json');
const ENGAGEMENT_LOG_FILE = path.join(PROJECT_ROOT, 'engagement_events.log');
const DEFAULT_BACKUP_ROOT_DIR = path.join(PROJECT_ROOT, 'backups');

// --- Helper Functions ---
async function ensureDirExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') { // Ignore if directory already exists
      throw error;
    }
  }
}

async function copyFileWithLogging(source, destination, operation = 'copying') {
  try {
    await fs.copyFile(source, destination);
    logger.info(`${operation} file: ${source} to ${destination}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`Source file not found for ${operation}: ${source}. Skipping.`);
    } else {
      throw error; // Re-throw other errors
    }
  }
}

// --- Backup Function ---
async function backupData(targetBackupRootDir = DEFAULT_BACKUP_ROOT_DIR) {
  logger.info('Starting data backup process...', { targetBackupRootDir });

  // 1. Flush in-memory data to JSON files
  try {
    logger.info('Flushing in-memory data to disk before backup...');
    // IMPORTANT: This relies on lib/db.js being able to run in a non-Next.js context
    // If lib/db.js has dependencies on Next.js runtime or specific env vars set by Next.js,
    // this direct import and call might fail or behave unexpectedly.
    // For this MVP, we assume it's simple enough.
    await flushMemoryToDisk(); // Assuming this function is synchronous or handles its own async ops
    logger.info('In-memory data flushed to disk successfully.');
  } catch (error) {
    logger.error('Failed to flush in-memory data to disk. Backup will proceed with on-disk data.', error);
    // Depending on severity, you might choose to abort the backup here.
  }

  // 2. Create timestamped backup directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // YYYY-MM-DDTHH-MM-SS-mmmZ
  const backupDir = path.join(targetBackupRootDir, timestamp);

  try {
    await ensureDirExists(backupDir);
    logger.info(`Created backup directory: ${backupDir}`);
  } catch (error) {
    logger.error('Failed to create backup directory.', error, { backupDir });
    return;
  }

  // 3. Copy data files
  try {
    // Copy dynamic data files
    const dynamicFiles = await fs.readdir(DYNAMIC_DATA_DIR);
    for (const file of dynamicFiles) {
      if (file.endsWith('.json')) {
        await copyFileWithLogging(
          path.join(DYNAMIC_DATA_DIR, file),
          path.join(backupDir, `dynamic_${file}`) // Prefix to avoid name clashes if other JSONs are backed up
        );
      }
    }

    // Copy secureVault.json
    await copyFileWithLogging(VAULT_FILE, path.join(backupDir, path.basename(VAULT_FILE)));
    
    // Copy engagement_events.log
    await copyFileWithLogging(ENGAGEMENT_LOG_FILE, path.join(backupDir, path.basename(ENGAGEMENT_LOG_FILE)));

    logger.info('Data backup completed successfully.', { backupDir });
  } catch (error) {
    logger.error('Error during data backup process.', error, { backupDir });
  }
}

// --- Restore Function ---
async function restoreData(sourceBackupDir) {
  logger.info('Starting data restoration process...', { sourceBackupDir });
  logger.warn('This will overwrite current data files. Ensure the application is stopped if necessary.');

  if (!sourceBackupDir) {
    logger.error('Restore failed: Source backup directory must be specified with --source.');
    return;
  }

  try {
    // Check if source directory exists
    await fs.access(sourceBackupDir);
  } catch (error) {
    logger.error('Restore failed: Source backup directory not found or not accessible.', error, { sourceBackupDir });
    return;
  }

  try {
    // Restore dynamic data files
    const backupFiles = await fs.readdir(sourceBackupDir);
    for (const file of backupFiles) {
      if (file.startsWith('dynamic_') && file.endsWith('.json')) {
        const originalFileName = file.replace('dynamic_', '');
        await copyFileWithLogging(
          path.join(sourceBackupDir, file),
          path.join(DYNAMIC_DATA_DIR, originalFileName),
          'restoring'
        );
      } else if (file === path.basename(VAULT_FILE)) {
        await copyFileWithLogging(
            path.join(sourceBackupDir, file), 
            VAULT_FILE,
            'restoring'
        );
      } else if (file === path.basename(ENGAGEMENT_LOG_FILE)) {
         await copyFileWithLogging(
            path.join(sourceBackupDir, file),
            ENGAGEMENT_LOG_FILE,
            'restoring'
        );
      }
    }
    logger.info('Data restoration completed successfully from.', { sourceBackupDir });
    logger.warn('It is recommended to restart the application to load the restored data.');
  } catch (error) {
    logger.error('Error during data restoration process.', error, { sourceBackupDir });
  }
}

// --- CLI Argument Parsing and Execution ---
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'backup') {
    let targetDir = DEFAULT_BACKUP_ROOT_DIR;
    const targetArgIndex = args.indexOf('--target');
    if (targetArgIndex !== -1 && args[targetArgIndex + 1]) {
      targetDir = args[targetArgIndex + 1];
    }
    await backupData(targetDir);
  } else if (command === 'restore') {
    let sourceDir = null;
    const sourceArgIndex = args.indexOf('--source');
    if (sourceArgIndex !== -1 && args[sourceArgIndex + 1]) {
      sourceDir = args[sourceArgIndex + 1];
    } else {
      logger.error("For 'restore' command, --source <path_to_backup> is required.");
      return;
    }
    await restoreData(sourceDir);
  } else {
    logger.info('Usage:');
    logger.info('  node scripts/manage-data.js backup [--target <backup_directory_path>]');
    logger.info('  node scripts/manage-data.js restore --source <path_to_specific_backup>');
  }
}

main().catch(error => {
  logger.error('Unhandled error in manage-data script:', error);
});
