const fs = require('fs');
let content = fs.readFileSync('src/components/projects/ProjectGrid.tsx', 'utf8');

// Add import
if (!content.includes('OptimizedImage')) {
  content = content.replace("import { Link } from \"react-router-dom\";", "import { Link } from \"react-router-dom\";\nimport { OptimizedImage } from '../ui/OptimizedImage';");
}

content = content.replace(
  /<img src={project.image \?\? "https:\/\/images.unsplash.com\/photo-1618005182384-a83a8bd57fbe\?q=80&w=1200&auto=format&fit=crop"} alt={project.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" \/>/g,
  '<OptimizedImage src={project.image || "/assets/placeholder-grid.webp"} alt={project.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />'
);
fs.writeFileSync('src/components/projects/ProjectGrid.tsx', content);
