const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<Route path="\/admin" element=\{<AdminDashboard \/>\} \/>/g, '');
code = code.replace(/const AdminDashboard = lazy\(\(\) => import\('\.\/pages\/AdminDashboard\.tsx'\)\);/g, '');

fs.writeFileSync('src/App.tsx', code);
