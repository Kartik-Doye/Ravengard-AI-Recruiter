const fs = require('fs');
let content = fs.readFileSync('src/components/projects/ProjectGrid.tsx', 'utf8');
content = content.replace(
  /<div\s+className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"\s+style={{\s+backgroundImage: `url\(\$\{project\.image \?\? "https:\/\/images\.unsplash\.com\/photo-1618005182384-a83a8bd57fbe\?q=80&w=2564&auto=format&fit=crop"\}\)`,\s+}}\s+\/>/g,
  '<img src={project.image ?? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"} alt={project.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />'
);
fs.writeFileSync('src/components/projects/ProjectGrid.tsx', content);
