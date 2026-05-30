const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const publicDir = path.join(projectRoot, "public");

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not find workspace root");
}

const workspaceRoot = findWorkspaceRoot(projectRoot);

function getBasePath() {
  const raw = process.env.BASE_PATH || "";
  return raw.replace(/\/+$/, "");
}

function getPublicUrl() {
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    const domain = process.env.REPLIT_INTERNAL_APP_DOMAIN.replace(/^https?:\/\//, "");
    return `https://${domain}${getBasePath()}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    const domain = process.env.REPLIT_DEV_DOMAIN.replace(/^https?:\/\//, "");
    return `https://${domain}${getBasePath()}`;
  }
  return getBasePath() || ".";
}

function runExpoExport(publicUrl) {
  console.log("Running expo export --platform web ...");
  console.log(`Public URL: ${publicUrl}`);

  const env = {
    ...process.env,
    NODE_ENV: "production",
    EXPO_NO_DOTENV: "1",
  };

  execSync(
    `pnpm exec expo export --platform web --output-dir dist`,
    {
      cwd: projectRoot,
      stdio: "inherit",
      env,
    }
  );
  console.log("Expo export complete.");
}

function copyPwaAssets(basePath) {
  fs.mkdirSync(distDir, { recursive: true });

  fs.copyFileSync(path.join(publicDir, "sw.js"), path.join(distDir, "sw.js"));
  console.log("Copied sw.js");

  const manifestTemplate = fs.readFileSync(path.join(publicDir, "manifest.json"), "utf-8");
  const manifest = manifestTemplate.replace(/__BASE_PATH__/g, basePath);
  fs.writeFileSync(path.join(distDir, "manifest.json"), manifest);
  console.log("Written manifest.json");

  const iconSrc = path.join(projectRoot, "assets", "images", "icon.png");
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(distDir, "icon-192.png"));
    fs.copyFileSync(iconSrc, path.join(distDir, "icon-512.png"));
    console.log("Copied icons");
  } else {
    console.warn("Warning: icon.png not found at", iconSrc);
  }
}

function getSplashHtml(basePath) {
  return `
  <style>
    #mp-splash {
      position: fixed; inset: 0; z-index: 999999;
      background: #0a1a0a;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.7s ease;
    }
    #mp-splash.mp-fade { opacity: 0; pointer-events: none; }
    .mp-inner {
      display: flex; flex-direction: column; align-items: center;
      animation: mpUp 0.7s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes mpUp {
      from { transform: translateY(28px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    #mp-scene { width: 260px; height: 180px; overflow: visible; }
    #mp-ball  { animation: mpKick 1.4s cubic-bezier(0.4,0,0.2,1) 0.5s infinite alternate; }
    @keyframes mpKick {
      from { transform: translate(0,0)   rotate(0deg); }
      to   { transform: translate(138px,-28px) rotate(360deg); }
    }
    .mp-title {
      color: #4ade80; font-size: 38px; font-weight: 800; margin: 4px 0 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
      letter-spacing: -0.5px; line-height: 1;
    }
    .mp-sub {
      color: #6b7280; font-size: 14px; margin: 6px 0 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
      letter-spacing: 0.3px;
    }
    .mp-dots { display: flex; gap: 7px; margin-top: 22px; }
    .mp-dot  {
      width: 9px; height: 9px; border-radius: 50%; background: #22c55e;
      animation: mpDot 1.3s ease-in-out infinite;
    }
    .mp-dot:nth-child(1){animation-delay:0s}
    .mp-dot:nth-child(2){animation-delay:0.22s}
    .mp-dot:nth-child(3){animation-delay:0.44s}
    .mp-dot:nth-child(4){animation-delay:0.66s}
    @keyframes mpDot {
      0%,80%,100%{ opacity:0.25; transform:scale(0.75); }
      40%        { opacity:1;    transform:scale(1.25); }
    }
    /* Hide Replit badge */
    [data-replit-badge],
    iframe[src*="replit.com/badge"],
    div[class*="replit-badge"],
    #replit-badge-container { display: none !important; }
  </style>

  <div id="mp-splash">
    <div class="mp-inner">
      <svg id="mp-scene" viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg">
        <!-- Ground -->
        <rect x="0" y="165" width="280" height="20" fill="#1a2e1a" rx="2"/>
        <line x1="15" y1="164" x2="265" y2="164" stroke="#2d5a27" stroke-width="2"/>

        <!-- Goal post -->
        <rect x="220" y="90" width="5"  height="74" fill="#d1d5db" rx="2"/>
        <rect x="242" y="90" width="5"  height="74" fill="#d1d5db" rx="2"/>
        <rect x="218" y="88" width="31" height="6"  fill="#d1d5db" rx="2"/>
        <!-- Net -->
        <line x1="225" y1="94" x2="242" y2="164" stroke="#4b5563" stroke-width="0.8"/>
        <line x1="233" y1="94" x2="242" y2="164" stroke="#4b5563" stroke-width="0.8"/>
        <line x1="225" y1="110" x2="242" y2="115" stroke="#4b5563" stroke-width="0.8"/>
        <line x1="225" y1="130" x2="242" y2="135" stroke="#4b5563" stroke-width="0.8"/>
        <line x1="225" y1="150" x2="242" y2="152" stroke="#4b5563" stroke-width="0.8"/>

        <!-- Football (bounces from monkey to goal) -->
        <g id="mp-ball">
          <circle cx="82" cy="148" r="13" fill="white" stroke="#1f2937" stroke-width="1.5"/>
          <polygon points="82,136 89,140 87,148 77,148 75,140" fill="#1f2937"/>
          <polygon points="95,145 100,141 98,150 93,153" fill="#1f2937"/>
          <polygon points="69,145 64,141 66,150 71,153" fill="#1f2937"/>
          <polygon points="82,161 89,157 87,148 77,148 75,157" fill="#1f2937"/>
        </g>

        <!-- Monkey body -->
        <ellipse cx="58" cy="132" rx="20" ry="22" fill="#92400e"/>
        <!-- Belly -->
        <ellipse cx="58" cy="135" rx="12" ry="14" fill="#c47f3a"/>
        <!-- Head -->
        <circle cx="58" cy="100" r="23" fill="#92400e"/>
        <!-- Ears -->
        <circle cx="37" cy="100" r="9"  fill="#92400e"/>
        <circle cx="37" cy="100" r="5.5" fill="#c47f3a"/>
        <circle cx="79" cy="100" r="9"  fill="#92400e"/>
        <circle cx="79" cy="100" r="5.5" fill="#c47f3a"/>
        <!-- Face muzzle -->
        <ellipse cx="58" cy="110" rx="13" ry="11" fill="#c47f3a"/>
        <!-- Eyes -->
        <circle cx="51" cy="94"  r="5"  fill="#1c1c1c"/>
        <circle cx="65" cy="94"  r="5"  fill="#1c1c1c"/>
        <circle cx="52.5" cy="92.5" r="1.8" fill="white"/>
        <circle cx="66.5" cy="92.5" r="1.8" fill="white"/>
        <!-- Eyebrows (excited expression) -->
        <path d="M47 88 Q51 84 55 87" stroke="#5c2c0a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M61 87 Q65 84 69 88" stroke="#5c2c0a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Nostrils -->
        <circle cx="55" cy="108" r="2" fill="#7c4a1a"/>
        <circle cx="61" cy="108" r="2" fill="#7c4a1a"/>
        <!-- Big open smile (excited) -->
        <path d="M48 114 Q58 124 68 114" stroke="#1c1c1c" stroke-width="2" fill="#e07060" stroke-linecap="round"/>
        <path d="M48 114 Q58 124 68 114" fill="#e07060"/>

        <!-- Left arm (balance) -->
        <path d="M40 128 Q25 132 20 148" stroke="#92400e" stroke-width="9" fill="none" stroke-linecap="round"/>
        <circle cx="18" cy="150" r="7" fill="#92400e"/>
        <!-- Right arm (raised up, celebrating) -->
        <path d="M76 126 Q92 108 100 94" stroke="#92400e" stroke-width="9" fill="none" stroke-linecap="round"/>
        <circle cx="102" cy="92" r="7.5" fill="#92400e"/>

        <!-- Left leg (standing) -->
        <path d="M50 152 Q48 160 46 165" stroke="#92400e" stroke-width="10" fill="none" stroke-linecap="round"/>
        <ellipse cx="44" cy="165" rx="9" ry="5" fill="#92400e"/>
        <!-- Right leg (kicking) -->
        <path d="M66 152 Q80 158 92 153" stroke="#92400e" stroke-width="10" fill="none" stroke-linecap="round"/>
        <ellipse cx="94" cy="152" rx="11" ry="7" fill="#92400e"/>

        <!-- Tail -->
        <path d="M40 142 Q18 138 13 122 Q8 106 22 98" stroke="#92400e" stroke-width="6" fill="none" stroke-linecap="round"/>
        <!-- Tail tip -->
        <circle cx="22" cy="97" r="5" fill="#c47f3a"/>
      </svg>

      <div class="mp-title">Monkey Post</div>
      <div class="mp-sub">A Free and fair Game</div>
      <div class="mp-dots">
        <div class="mp-dot"></div>
        <div class="mp-dot"></div>
        <div class="mp-dot"></div>
        <div class="mp-dot"></div>
      </div>
    </div>
  </div>

  <script>
    // Remove Replit badge via MutationObserver
    (function(){
      function killBadge(node){
        if(!node||node.nodeType!==1) return;
        var a=node.getAttribute&&node.getAttribute('data-replit-badge');
        var b=node.tagName==='IFRAME'&&node.src&&node.src.indexOf('replit.com/badge')>-1;
        var c=node.id==='replit-badge-container';
        if(a||b||c){ node.style.cssText='display:none!important'; }
      }
      var mo=new MutationObserver(function(ms){
        ms.forEach(function(m){
          m.addedNodes.forEach(killBadge);
          if(m.target&&m.target.nodeType===1) killBadge(m.target);
        });
      });
      mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-replit-badge']});
    })();

    // Splash auto-hide at 5 s
    var _mpTimer = setTimeout(function(){
      var s=document.getElementById('mp-splash');
      if(s){ s.classList.add('mp-fade'); setTimeout(function(){ s&&s.remove(); },750); }
    }, 5000);

    // Called by React once first render is done (with 1.5 s minimum so animation is always seen)
    window.__mpHideSplash = function(){
      clearTimeout(_mpTimer);
      setTimeout(function(){
        var s=document.getElementById('mp-splash');
        if(s){ s.classList.add('mp-fade'); setTimeout(function(){ s&&s.remove(); },750); }
      }, 1500);
    };
  </script>`;
}

function patchIndexHtml(basePath) {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("ERROR: dist/index.html not found after export.");
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, "utf-8");

  if (basePath) {
    html = html.replace(/="\/(?!\/)/g, `="${basePath}/`);
  }

  const pwaHead = `
  <link rel="manifest" href="${basePath}/manifest.json" />
  <meta name="theme-color" content="#000000" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Rotation" />
  <link rel="apple-touch-icon" href="${basePath}/icon-192.png" />
  <link rel="apple-touch-startup-image" href="${basePath}/icon-512.png" />`;

  const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('${basePath}/sw.js', { scope: '${basePath}/' })
          .then(function() { console.log('[PWA] Service worker registered'); })
          .catch(function(e) { console.warn('[PWA] SW registration failed:', e); });
      });
    }
  </script>`;

  html = html.replace("</head>", pwaHead + "\n</head>");
  html = html.replace("</body>", getSplashHtml(basePath) + "\n" + swScript + "\n</body>");

  fs.writeFileSync(indexPath, html);
  console.log("Patched dist/index.html with PWA tags + splash screen.");
}

async function main() {
  console.log("=== Football Rotation — Production Web Build ===");

  const basePath = getBasePath();
  const publicUrl = getPublicUrl();

  console.log(`Base path: "${basePath}"`);

  runExpoExport(publicUrl);
  copyPwaAssets(basePath);
  patchIndexHtml(basePath);

  console.log("\n=== Build complete! ===");
  console.log(`Output: ${distDir}`);
}

main().catch((err) => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
