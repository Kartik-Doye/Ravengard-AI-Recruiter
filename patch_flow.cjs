const fs = require('fs');
let file = fs.readFileSync('src/hooks/useInterviewFlow.ts', 'utf8');

const additions = `
  'interview_hr_friendly': '/interview/engine',
  'interview_technical': '/interview/engine',
  'interview_cto': '/interview/engine',
`;

file = file.replace("'waiting_room': '/interview/waiting-room'", "'waiting_room': '/interview/waiting-room'," + additions);
fs.writeFileSync('src/hooks/useInterviewFlow.ts', file);
