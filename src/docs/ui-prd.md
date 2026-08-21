# Ravengard UI/UX Product Requirements Document (PRD)

## 1. Product Vision
Ravengard AI Recruiter will present its candidate experience through a **HorizonX-inspired premium portfolio UI**. The goal is to elevate the standard interview flow into an immersive, high-end interactive experience. It will utilize layered motion, parallax scrolling, sophisticated hover effects, and a smooth initial loader to establish a premium brand presence. The candidate journey will feel less like a standard form and more like an exclusive, interactive narrative.

## 2. Design Reference & Identity
- **Theme**: Premium Dark / Deep Twilight.
- **Typography**: High-contrast pairing. A distinctive display font for headings (e.g., Playfair Display or a sharp geometric sans) paired with a highly legible, refined body font (e.g., Plus Jakarta Sans). Step ratios of 1.25 or 1.333 for strong hierarchical contrast.
- **Color Palette**: Sophisticated neutrals. Cool, deep charcoal backgrounds (e.g., `#0A0B0E`) with high-contrast, off-white text (`#F3F4F6`). Accents will rely on subtle monochromatic shifts rather than saturated, generic gradients.
- **Aesthetic Rules**: 
  - No generic "AI Slop" (no arbitrary glassmorphism with glowing drop-shadows, no purple-to-blue gradients).
  - Borders and shapes will be mathematically precise. 
  - Depth will be achieved through typography, negative space, and motion, not excessive nested containers.

## 3. Sitemap
While the core interview flow remains strictly sequential and state-locked, the outer application will feature a comprehensive marketing and narrative structure:
1. **`/` (Home)**: The premium landing experience.
2. **`/about` (About / Story)**: The narrative of the AI Recruiter and company culture.
3. **`/features` (Feature / Flow pages)**: Detailed breakdown of the interview process (Intelligence, Anti-Cheat, Assessment).
4. **`/assessment-guide` (Assessment Explanation)**: Transparency regarding how candidates are scored and evaluated.
5. **`/case-studies` (Optional)**: Real-world success stories or mock examples of candidate reports.
6. **`/interview` (Contact / Start Session)**: The gateway to the locked, sequential interview state machine.

## 4. Page-by-Page Structure

### Home (`/`)
- **Smooth Loader**: A minimalist, mathematically scaled loader that gracefully fades out to reveal the hero.
- **Hero Section**: Large, high-contrast display typography. Subtle parallax background. Primary CTA: "Begin Interview Session".
- **Supporting Sections**: Scroll-triggered reveals of key benefits (Speed, Fairness, Depth).
- **Footer**: Clean, standard navigation links.

### About / Story (`/about`)
- **Narrative Scroll**: Content fades in rhythmically as the user scrolls.
- **Timeline**: A clean, vertical or horizontal interactive timeline explaining the evolution of the recruitment process.

### Feature / Flow Pages (`/features`)
- **Bento Grid**: Asymmetric grid layout explaining the engine (Resume Parsing, Device Checks, Dynamic Rounds). 
- **Hover States**: Cards feature subtle scaling (`scale-105`) and border opacity shifts on hover to invite interaction.

### Assessment Guide (`/assessment-guide`)
- **Transparency Breakdown**: Clear typographic hierarchy explaining the normalized scoring (Technical, Communication, Reasoning).
- **Data Privacy**: Reassurance regarding PII handling and cascade-deletion policies.

### Contact / Start Session (`/interview`)
- **Entry Gateway**: A highly focused, minimalist screen capturing the initial email/registration details before locking the session and handing off control to the backend state machine.

## 5. Component Inventory
- **Buttons**: Sharp or perfectly pill-shaped (no awkward in-between radii). Hover states use opacity and subtle transform shifts.
- **Cards**: Minimalist borders (`border-white/10`). Inner corner radii perfectly calculated against outer radii (`Inner = Outer - Padding`).
- **Inputs**: Clean underlines or unified subtle-fill backgrounds. Focus states use high-contrast color changes, not thick glowing rings.
- **Loaders**: Minimalist spinners or progressive reveal bars.

## 6. Motion Rules
- **Easing**: Custom bezier curves (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`) for snappy, frictionless transitions.
- **Reveals**: Staggered fade-up animations (`y: 20`, `opacity: 0` to `y: 0`, `opacity: 1`) for lists and grid items.
- **Page Transitions**: Smooth cross-fades using Framer Motion to ensure the SPA feels like a native application.
- **Parallax**: Subtle speed differentials on background elements to create depth without causing motion sickness.

## 7. Responsive Rules
- **Mobile-First Code, Desktop-First Precision**: Layouts will respond fluidly. 
- **Touch Targets**: Minimum 44px for all interactive elements on mobile.
- **Density**: On wide screens (`xl`), bento grids expand horizontally; on mobile, they stack cleanly with generous vertical rhythm.

## 8. Tech Stack
- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS
- **Animation**: `motion/react` (Framer Motion)
- **Icons**: `lucide-react`
- **Routing**: Client-side routing mapped to the sitemap.

## 9. Implementation Phases

**Phase 1: Foundation (Current Step)**
- Define sitemap, design tokens (colors, typography), and motion rules.

**Phase 2: Component Library**
- Build the core component inventory (Buttons, Cards, Inputs, Layout Wrappers) using mock data.

**Phase 3: Page Skeletons & Layout**
- Assemble the static pages (Home, About, Features, Guide) without any backend wiring.

**Phase 4: Motion & Polish**
- Integrate Framer Motion for scroll reveals, parallax, and page transitions. Ensure the "HorizonX" premium feel is achieved.

**Phase 5: UX Review**
- Review the static prototype for layout, responsiveness, readability, and interaction quality.

**Phase 6: Backend Integration**
- Wire the `/interview` gateway to the existing strict session state machine. Connect the live APIs for registration, intelligence, parsing, and assessments.
