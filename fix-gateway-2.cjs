const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');

// 1. Fix the unused constant
code = code.replace(
  "const _UNUSED_STAGE_ROUTE_MAP_: Record<string, string> = {",
  "const _UNUSED_STAGE_ROUTE_MAP_ = {"
);
// wait, the error said `const _UNUSED_STAGE_ROUTE_MAP_:\n  'welcome': ...`
// Let's just remove the block entirely since it's unused.
code = code.replace(
  /const _UNUSED_STAGE_ROUTE_MAP_[\s\S]*?};/,
  ""
);

// 2. Fix duplicate activeStage
code = code.replace(
  "const activeStage = activeSession?.currentPhase || activeSession?.currentStage || 'welcome';",
  ""
);

fs.writeFileSync('src/pages/InterviewGateway.tsx', code);
