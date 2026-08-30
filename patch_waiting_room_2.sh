#!/bin/bash
sed -i 's|from '\''./ui/Card'\'';|from '\''../components/ui/Card'\'';|g' src/pages/WaitingRoom.tsx
sed -i 's|from '\''./ui/Button'\'';|from '\''../components/ui/Button'\'';|g' src/pages/WaitingRoom.tsx
sed -i 's|animate-\[pulse_4s_ease-in-out_infinite\]|animate-subtle-pulse|g' src/pages/WaitingRoom.tsx
