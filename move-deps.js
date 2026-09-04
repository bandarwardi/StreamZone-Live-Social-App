const fs = require('fs');
const pkgPath = './artifacts/streamzone/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const depsToMove = [
  'expo', 'expo-blur', 'expo-constants', 'expo-font', 'expo-glass-effect',
  'expo-haptics', 'expo-image', 'expo-image-picker', 'expo-linear-gradient',
  'expo-linking', 'expo-location', 'expo-router', 'expo-splash-screen',
  'expo-status-bar', 'expo-symbols', 'expo-system-ui', 'expo-web-browser',
  'react', 'react-dom', 'react-native',
  'react-native-gesture-handler', 'react-native-keyboard-controller',
  'react-native-reanimated', 'react-native-safe-area-context',
  'react-native-screens', 'react-native-svg', 'react-native-web',
  'react-native-worklets', '@react-native-async-storage/async-storage'
];

pkg.dependencies = pkg.dependencies || {};

for (const dep of depsToMove) {
  if (pkg.devDependencies && pkg.devDependencies[dep]) {
    pkg.dependencies[dep] = pkg.devDependencies[dep];
    delete pkg.devDependencies[dep];
  }
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Moved dependencies successfully.');
