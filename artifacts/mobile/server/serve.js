/**
 * Production server for Expo static web export.
 * Serves dist/ as a PWA-capable SPA.
 * - Injects PWA meta tags into index.html at request time (base-path aware)
 * - Serves manifest.json with correct base path substituted
 * - All unknown routes return index.html (SPA routing)
 * - Zero external dependencies
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST_ROOT = path.resolve(__dirname, "..", "dist");
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const basePath = (process.env.BASE_PATH || "").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
};

function getIndexHtml() {
  const indexPath = path.join(DIST_ROOT, "index.html");
  if (!fs.existsSync(indexPath)) {
    return null;
  }

  let html = fs.readFileSync(indexPath, "utf-8");

  if (basePath && !html.includes(`href="${basePath}/manifest.json"`)) {
    if (!html.includes('rel="manifest"')) {
      const pwaHead = `
  <link rel="manifest" href="${basePath}/manifest.json" />
  <meta name="theme-color" content="#000000" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Rotation" />
  <link rel="apple-touch-icon" href="${basePath}/icon-192.png" />`;

      const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('${basePath}/sw.js', { scope: '${basePath}/' })
          .then(function() { console.log('[PWA] SW registered'); })
          .catch(function(e) { console.warn('[PWA] SW failed:', e); });
      });
    }
  </script>`;

      html = html.replace("</head>", pwaHead + "\n</head>");
      html = html.replace("</body>", swScript + "\n</body>");
    }

    html = html.replace(/="\/(?!\/)/g, `="${basePath}/`);
  }

  return html;
}

function serveManifest(res) {
  const templatePath = path.join(PUBLIC_DIR, "manifest.json");
  const distPath = path.join(DIST_ROOT, "manifest.json");

  const src = fs.existsSync(distPath)
    ? distPath
    : fs.existsSync(templatePath)
    ? templatePath
    : null;

  if (!src) {
    res.writeHead(404);
    res.end("manifest.json not found");
    return;
  }

  let content = fs.readFileSync(src, "utf-8");
  content = content.replace(/__BASE_PATH__/g, basePath);

  res.writeHead(200, {
    "content-type": "application/manifest+json",
    "cache-control": "public, max-age=86400",
  });
  res.end(content);
}

function serveStaticFile(pathname, res) {
  const safe = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(DIST_ROOT, safe);

  if (!filePath.startsWith(DIST_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);

  const isImmutable =
    pathname.includes("/_expo/") ||
    pathname.includes("/assets/") ||
    ext === ".woff2" ||
    ext === ".woff" ||
    ext === ".ttf";

  res.writeHead(200, {
    "content-type": contentType,
    "cache-control": isImmutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600",
  });
  res.end(content);
  return true;
}

function serveIndex(res) {
  const html = getIndexHtml();
  if (!html) {
    res.writeHead(503);
    res.end(
      "App not built yet. Run: pnpm --filter @workspace/mobile run build"
    );
    return;
  }
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-cache, no-store, must-revalidate",
  });
  res.end(html);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (pathname === "/manifest.json" || pathname === "/manifest.webmanifest") {
    return serveManifest(res);
  }

  if (pathname === "/sw.js") {
    const sw = path.join(DIST_ROOT, "sw.js");
    const fallback = path.join(PUBLIC_DIR, "sw.js");
    const src = fs.existsSync(sw) ? sw : fs.existsSync(fallback) ? fallback : null;
    if (src) {
      res.writeHead(200, {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-cache, no-store, must-revalidate",
        "service-worker-allowed": basePath + "/",
      });
      res.end(fs.readFileSync(src));
      return;
    }
  }

  if (pathname !== "/" && pathname !== "/index.html") {
    const served = serveStaticFile(pathname, res);
    if (served) return;
  }

  serveIndex(res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`[Football Rotation] Serving on port ${port}`);
  console.log(`[Football Rotation] Dist: ${DIST_ROOT}`);
  console.log(`[Football Rotation] Base path: "${basePath}"`);
  if (!fs.existsSync(path.join(DIST_ROOT, "index.html"))) {
    console.warn(
      "[Football Rotation] WARNING: dist/index.html not found. Run build first."
    );
  }
});
