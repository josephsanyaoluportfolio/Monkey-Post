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
  html = html.replace("</body>", swScript + "\n</body>");

  fs.writeFileSync(indexPath, html);
  console.log("Patched dist/index.html with PWA tags.");
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
