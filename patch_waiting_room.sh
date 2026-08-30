#!/bin/bash
sed -i 's|const \[confirmed, setConfirmed\] = useState(false);|const \[confirmed, setConfirmed\] = useState(false);\n  const isDeviceReady = session?.deviceCheckStatus === '\'passed\'';|g' src/components/WaitingRoom.tsx

sed -i 's|Your device has been verified|{isDeviceReady ? "Your device has been verified" : "Warning: Device verification incomplete."}|g' src/components/WaitingRoom.tsx

sed -i 's|disabled={loading || confirmed}|disabled={loading || confirmed || !isDeviceReady}|g' src/components/WaitingRoom.tsx
