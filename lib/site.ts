export interface SiteParts {
  title?: string;
  html: string;
  css: string;
  js: string;
}

/** html + css + js ko ek complete standalone HTML document me combine karo */
export function buildDocument(site: SiteParts): string {
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
${site.html || ""}
<script>
${site.js || ""}
</script>
</body>
</html>`;
}
