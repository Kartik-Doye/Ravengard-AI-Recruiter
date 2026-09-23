import fs from 'fs';
import path from 'path';

function validateBuild() {
  const distDir = path.resolve(process.cwd(), 'build');
  console.log('Validating build output in:', distDir);

  if (!fs.existsSync(distDir)) {
    console.error('ERROR: Build directory "build" does not exist!');
    process.exit(1);
  }

  const requiredFiles = ['index.html', 'server.cjs'];
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: Missing required build artifact: ${file}`);
      process.exit(1);
    }
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.error(`ERROR: Build artifact ${file} is empty (0 bytes)!`);
      process.exit(1);
    }
  }

  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('ERROR: Missing "build/assets" directory!');
    process.exit(1);
  }

  const assetFiles = fs.readdirSync(assetsDir);
  const hasJs = assetFiles.some((f) => f.endsWith('.js'));
  const hasCss = assetFiles.some((f) => f.endsWith('.css'));

  if (!hasJs) {
    console.error('ERROR: No JavaScript bundles found in build/assets!');
    process.exit(1);
  }

  if (!hasCss) {
    console.error('ERROR: No CSS bundles found in build/assets!');
    process.exit(1);
  }

  console.log('Build validation passed successfully! All essential artifacts verified.');
}

validateBuild();
