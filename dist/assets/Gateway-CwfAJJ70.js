import{j as e,m as a,l,b as m,Q as c,$ as d,ae as u,af as x,a8 as b,a7 as N,a0 as f}from"./vendor-DPsW69cr.js";import{B as o}from"./index-B5_jhQ1P.js";const s={hero:{title:"Start your session",body:"Enter the premium interview flow. A purely objective, state-machine driven evaluation of your technical depth."}};function h(){return e.jsxDEV("section",{className:"relative pt-32 pb-12 px-6 lg:pt-48 overflow-hidden text-center",children:[e.jsxDEV("div",{className:"absolute inset-0 pointer-events-none",children:e.jsxDEV("div",{className:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full max-h-[300px] bg-white/5 blur-[120px] rounded-full"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:9,columnNumber:9},this)},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:8,columnNumber:7},this),e.jsxDEV("div",{className:"max-w-4xl mx-auto relative z-10",children:e.jsxDEV(a.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.6,ease:[.16,1,.3,1]},children:[e.jsxDEV("div",{className:"inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/70 mb-8",children:"Evaluation Gateway"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:18,columnNumber:11},this),e.jsxDEV("h1",{className:"text-5xl lg:text-7xl font-display font-medium leading-[1.1] tracking-tight mb-6",children:s.hero.title},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:21,columnNumber:11},this),e.jsxDEV("p",{className:"text-xl text-white/60 leading-relaxed max-w-2xl mx-auto",children:s.hero.body},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:24,columnNumber:11},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:13,columnNumber:9},this)},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:12,columnNumber:7},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayHero.tsx",lineNumber:7,columnNumber:5},this)}function v(){return e.jsxDEV(p,{children:e.jsxDEV("div",{className:"banter-loader",children:[e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:9,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:10,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:11,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:12,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:13,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:14,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:15,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:16,columnNumber:9},this),e.jsxDEV("div",{className:"banter-loader__box"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:17,columnNumber:9},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:8,columnNumber:7},this)},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/ui/SmoothLoader.tsx",lineNumber:7,columnNumber:5},this)}const p=l.div`
  .banter-loader {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 72px;
    height: 72px;
    margin-left: -36px;
    margin-top: -36px;
  }

  .banter-loader__box {
    float: left;
    position: relative;
    width: 20px;
    height: 20px;
    margin-right: 6px;
  }

  .banter-loader__box:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #fff;
  }

  .banter-loader__box:nth-child(3n) {
    margin-right: 0;
    margin-bottom: 6px;
  }

  .banter-loader__box:nth-child(1):before, .banter-loader__box:nth-child(4):before {
    animation: moveLeft 2s ease-in-out infinite;
  }

  .banter-loader__box:nth-child(3):before, .banter-loader__box:nth-child(6):before {
    animation: moveRight 2s ease-in-out infinite;
  }

  @keyframes moveLeft {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(100%, 0);
    }
  }

  @keyframes moveRight {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(-100%, 0);
    }
  }
`;function g(){const t=m();return e.jsxDEV("section",{className:"py-12 px-6",children:e.jsxDEV("div",{className:"max-w-2xl mx-auto text-center",children:e.jsxDEV(a.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{duration:.6,delay:.2,ease:[.16,1,.3,1]},className:"glass-panel p-10 md:p-16 rounded-[2.5rem] flex flex-col items-center border border-white/10",children:[e.jsxDEV("div",{className:"w-24 h-24 relative mb-12 flex items-center justify-center",children:e.jsxDEV(v,{},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:21,columnNumber:13},this)},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:20,columnNumber:11},this),e.jsxDEV("h2",{className:"text-2xl font-medium mb-8 text-white",children:"System is ready."},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:24,columnNumber:11},this),e.jsxDEV("div",{className:"w-full space-y-4",children:[e.jsxDEV(o,{variant:"solid",fullWidth:!0,className:"py-5",onClick:()=>t("/interview"),rightIcon:e.jsxDEV(c,{className:"w-5 h-5 group-hover:translate-x-1 transition-transform"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:32,columnNumber:26},this),children:"Initialize Engine"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:27,columnNumber:13},this),e.jsxDEV(o,{variant:"outline",fullWidth:!0,className:"py-5",onClick:()=>t("/assessment-guide"),children:"Read the Guide First"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:37,columnNumber:13},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:26,columnNumber:11},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:14,columnNumber:9},this)},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:13,columnNumber:7},this)},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayActions.tsx",lineNumber:12,columnNumber:5},this)}function w(){const t=[{icon:d,title:"Objective Rubric"},{icon:u,title:"Zero Cheating"},{icon:x,title:"Bias-Free"},{icon:b,title:"Real-time Metrics"},{icon:N,title:"O(1) Telemetry"},{icon:f,title:"Instant Feedback"}],i=[...t,...t,...t];return e.jsxDEV("section",{className:"py-16 border-t border-white/5 bg-[var(--color-bg-1)] overflow-hidden flex flex-col items-center",children:[e.jsxDEV("div",{className:"mb-10 flex flex-col items-center text-center",children:[e.jsxDEV("span",{className:"text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-2",children:"Engine Architecture"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:21,columnNumber:9},this),e.jsxDEV("h2",{className:"text-xl font-display text-white/90",children:"Built for precision and integrity."},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:22,columnNumber:9},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:20,columnNumber:7},this),e.jsxDEV("div",{className:"relative w-full max-w-[100vw] overflow-hidden flex items-center",children:[e.jsxDEV("div",{className:"absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--color-bg-1)] to-transparent z-10"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:27,columnNumber:9},this),e.jsxDEV("div",{className:"absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--color-bg-1)] to-transparent z-10"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:28,columnNumber:9},this),e.jsxDEV(a.div,{className:"flex gap-8 whitespace-nowrap",animate:{x:["0%","-33.33%"]},transition:{repeat:1/0,ease:"linear",duration:20},children:i.map((r,n)=>e.jsxDEV("div",{className:"flex items-center gap-4 px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shrink-0",children:[e.jsxDEV(r.icon,{className:"w-5 h-5 text-white/70"},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:44,columnNumber:15},this),e.jsxDEV("span",{className:"text-sm font-medium text-white/90",children:r.title},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:45,columnNumber:15},this)]},n,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:40,columnNumber:13},this))},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:30,columnNumber:9},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:25,columnNumber:7},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/components/gateway/GatewayTrustStrip.tsx",lineNumber:19,columnNumber:5},this)}function j(){return e.jsxDEV("div",{className:"flex flex-col min-h-screen",children:[e.jsxDEV(h,{},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/pages/Gateway.tsx",lineNumber:9,columnNumber:7},this),e.jsxDEV(g,{},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/pages/Gateway.tsx",lineNumber:10,columnNumber:7},this),e.jsxDEV(w,{},void 0,!1,{fileName:"E:/STUDIO Project/Ravengard/src/pages/Gateway.tsx",lineNumber:11,columnNumber:7},this)]},void 0,!0,{fileName:"E:/STUDIO Project/Ravengard/src/pages/Gateway.tsx",lineNumber:8,columnNumber:5},this)}export{j as default};
