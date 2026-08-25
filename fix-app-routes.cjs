const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('AdminDashboard')) {
  code = code.replace(
    'const NotFound = lazy(() => import(\'./pages/NotFound.tsx\'));',
    "const NotFound = lazy(() => import('./pages/NotFound.tsx'));\nconst AdminDashboard = lazy(() => import('./pages/AdminDashboard.tsx'));"
  );
  
  code = code.replace(
    '<Route path="/interview/*" element={<InterviewGateway />} />',
    '<Route path="/admin" element={<AdminDashboard />} />\n                      <Route path="/interview/*" element={<InterviewGateway />} />'
  );
  
  fs.writeFileSync('src/App.tsx', code);
}
