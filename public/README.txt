SMART-AGRO REFERENCE-STYLE DASHBOARD UPDATE

Files in this package:
- index.html : updated navigation markup and user dashboard markup
- css.css    : original stylesheet plus one isolated dashboard redesign layer
- script.js  : original app logic plus updated view switcher and dashboard renderer
- q.jpg      : local farm image used by the dashboard background

Install:
1. Back up your current project folder.
2. Copy index.html, css.css and script.js into your project's public folder and replace those three files.
3. Copy q.jpg into public only if it is not already there. Do not overwrite it if you have customized it.
4. Do not replace data.json, .env, server.js, routes, services, package.json or node_modules.
5. Restart the Node server and hard-refresh the browser (Ctrl+Shift+R).

Notes:
- The dashboard uses existing API and livestock records only.
- Existing IDs used by profile, animal, alert and chart code are retained.
- The admin page and other view markup are not redesigned by this update.
- Both light and dark theme states have dashboard styles.
- Chart.js is still loaded from the existing CDN script in index.html.
