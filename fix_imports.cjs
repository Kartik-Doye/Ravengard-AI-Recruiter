const fs = require('fs');

let device = fs.readFileSync('src/components/DeviceCheck.tsx', 'utf8');
if (!device.includes('import React')) {
  device = device.replace('import { useState', 'import React, { useState');
}
fs.writeFileSync('src/components/DeviceCheck.tsx', device);

let instructions = fs.readFileSync('src/components/InterviewInstructions.tsx', 'utf8');
if (!instructions.includes('import React')) {
  instructions = instructions.replace('import { useState', 'import React, { useState');
}
fs.writeFileSync('src/components/InterviewInstructions.tsx', instructions);
