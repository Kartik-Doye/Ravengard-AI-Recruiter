const fs = require('fs');
let file = fs.readFileSync('src/components/CommandPalette.tsx', 'utf8');
file = file.replace(/export default function CommandPalette\(\{ isOpen, setIsOpen, onNavigate, onThemeChange \}: any\) \{/, `import { useTheme } from '../contexts/ThemeContext';\n\nexport default function CommandPalette({ isOpen, setIsOpen, onNavigate }: any) {
  const { toggleTheme } = useTheme();
`);
file = file.replace(/onThemeChange\('light'\)/g, "toggleTheme()");
file = file.replace(/onThemeChange\('dark'\)/g, "toggleTheme()");
file = file.replace(/onThemeChange\('high-contrast'\)/g, "toggleTheme()");
fs.writeFileSync('src/components/CommandPalette.tsx', file);
