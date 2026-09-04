const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch root node_modules for junction / symlinked packages
config.watchFolders = [path.resolve(workspaceRoot, 'node_modules')];

// Enable symlink and package exports resolution in Metro
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;



