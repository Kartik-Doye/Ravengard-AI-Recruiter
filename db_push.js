const { execSync } = require('child_process');
try {
  execSync('npm run db:push -- --accept-data-loss', { stdio: 'inherit' });
} catch (e) {
  console.log("Push failed or exited");
}
