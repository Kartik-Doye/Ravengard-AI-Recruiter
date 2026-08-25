const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/currentPhase: 'intelligence'/g, "currentPhase: 'resume'");

code = code.replace(/const validTransitions: Record<string, string\[\]> = \{[\s\S]*?\};\n\s*const allowedNext = validTransitions\[currentSession.currentPhase\] \|\| \[\];/m, `const validTransitions: Record<string, string[]> = {
          'welcome': ['consent'],
          'consent': ['resume'],
          'resume': ['resume_analysis', 'consent'],
          'resume_analysis': ['instructions', 'resume'],
          'instructions': ['device_check', 'resume_analysis'],
          'device_check': ['waiting_room', 'instructions'],
          'waiting_room': ['interview_hr_friendly', 'device_check'],
          'interview_hr_friendly': ['completed']
        };
        const allowedNext = validTransitions[currentSession.currentPhase] || [];`);

fs.writeFileSync('server.ts', code);
