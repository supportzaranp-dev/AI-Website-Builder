export interface SiteParts {
  title?: string;
  html: string;
  css: string;
  js: string;
}

/**
 * Website ko ek complete standalone HTML document me badlo.
 * Agar html pehle se hi poora document hai (<!DOCTYPE / <html), use waisa hi rakho.
 * Warna html+css+js ko wrap karke document banao (purani versions ke liye).
 */
export function buildDocument(site: SiteParts): string {
  const html = site.html || "";
  const isFullDoc = /<!doctype html/i.test(html) || /<html[\s>]/i.test(html);
  if (isFullDoc) return html;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${site.title || "Website"}</title>
<style>
${site.css || ""}
</style>
</head>
<body>
${html}
<script>
${site.js || ""}
</script>
</body>
</html>`;
}
