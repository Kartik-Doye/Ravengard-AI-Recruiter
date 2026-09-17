const fs = require('fs');
let code = fs.readFileSync('src/components/Registration.tsx', 'utf8');

const oldFetch = `      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(formData)
      });`;

const newFetch = `      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
      
      let res;
      try {
        res = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(formData),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('src/components/Registration.tsx', code);
