export const wireframeCss = `
/* ===== Reset & Base ===== */
:root {
  --white: #FFFFFF;
  --light: #F5F5F5;
  --muted: #E0E0E0;
  --medium: #9E9E9E;
  --dark: #424242;
  --black: #212121;
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-muted: #9E9E9E;
  --text-inverse: #FFFFFF;
  --gap-xs: 4px;
  --gap-sm: 8px;
  --gap-md: 16px;
  --gap-lg: 24px;
  --gap-xl: 32px;
  --radius: 4px;
  --sidebar-width: 240px;
  --topbar-height: 56px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.5; color: var(--text-primary); background: var(--light); }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
img, svg { max-width: 100%; display: block; }

/* ===== Screen & Viewport ===== */
.screen { background: var(--white); border: 1px solid var(--muted); margin: 24px auto; position: relative; min-height: 200px; overflow: hidden; }
.screen[data-title]::before { content: attr(data-title); display: block; background: var(--light); border-bottom: 1px solid var(--muted); padding: 6px 12px; font-size: 12px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.viewport-desktop, .viewport-tablet, .viewport-mobile { margin: 16px auto; border: 1px dashed var(--muted); position: relative; }
.viewport-desktop { max-width: 1280px; }
.viewport-tablet { max-width: 768px; }
.viewport-mobile { max-width: 375px; }
.viewport-desktop::before, .viewport-tablet::before, .viewport-mobile::before { content: attr(class); font-size: 10px; color: var(--text-muted); position: absolute; top: -16px; left: 0; }

/* ===== Page Shells ===== */
.shell-single { display: flex; flex-direction: column; min-height: 100%; }
.shell-topbar { display: grid; grid-template-rows: auto 1fr; min-height: 400px; }
.shell-sidebar-left { display: grid; grid-template-columns: var(--sidebar-width) 1fr; min-height: 400px; }
.shell-sidebar-right { display: grid; grid-template-columns: 1fr var(--sidebar-width); min-height: 400px; }
.shell-topbar-sidebar { display: grid; grid-template-columns: var(--sidebar-width) 1fr; grid-template-rows: auto 1fr; min-height: 400px; }
.shell-topbar-sidebar > .navbar-horizontal { grid-column: 1 / -1; }
.shell-centered { display: flex; align-items: center; justify-content: center; min-height: 400px; padding: var(--gap-lg); }
.shell-centered > * { width: 100%; max-width: 480px; }
.shell-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 400px; }

/* ===== Layout Utilities ===== */
.stack { display: flex; flex-direction: column; gap: var(--gap-md); }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--gap-md); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap-md); }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap-md); }
.split-50-50 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-md); }
.split-30-70 { display: grid; grid-template-columns: 3fr 7fr; gap: var(--gap-md); }
.split-70-30 { display: grid; grid-template-columns: 7fr 3fr; gap: var(--gap-md); }
.split-25-75 { display: grid; grid-template-columns: 1fr 3fr; gap: var(--gap-md); }
.split-75-25 { display: grid; grid-template-columns: 3fr 1fr; gap: var(--gap-md); }
.split-60-40 { display: grid; grid-template-columns: 3fr 2fr; gap: var(--gap-md); }
.split-40-60 { display: grid; grid-template-columns: 2fr 3fr; gap: var(--gap-md); }
.cluster { display: flex; flex-wrap: wrap; gap: var(--gap-sm); align-items: center; }
.pinned-bottom { margin-top: auto; }

/* Gap modifiers */
.gap-xs { gap: var(--gap-xs); }
.gap-sm { gap: var(--gap-sm); }
.gap-md { gap: var(--gap-md); }
.gap-lg { gap: var(--gap-lg); }
.gap-xl { gap: var(--gap-xl); }

/* Padding */
.padding-none { padding: 0; }
.padding-sm { padding: var(--gap-sm); }
.padding-md { padding: var(--gap-md); }
.padding-lg { padding: var(--gap-lg); }
.padding-xl { padding: var(--gap-xl); }

/* ===== Typography ===== */
.text-xs { font-size: 12px; }
.text-sm { font-size: 14px; }
.text-md { font-size: 16px; }
.text-lg { font-size: 20px; }
.text-xl { font-size: 24px; }
.text-display { font-size: 36px; }
.text-bold { font-weight: 700; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* ===== Colors ===== */
.bg-white { background-color: var(--white); }
.bg-light { background-color: var(--light); }
.bg-muted { background-color: var(--muted); }
.bg-medium { background-color: var(--medium); }
.bg-dark { background-color: var(--dark); }
.bg-black { background-color: var(--black); }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
.text-inverse { color: var(--text-inverse); }

/* ===== Card ===== */
.card { background: var(--white); border: 1px solid var(--muted); border-radius: var(--radius); padding: var(--gap-md); }
.card-interactive { background: var(--white); border: 1px solid var(--muted); border-radius: var(--radius); padding: var(--gap-md); cursor: pointer; }
.card-interactive:hover { border-color: var(--medium); }

/* ===== Navigation ===== */
.navbar-horizontal { display: flex; align-items: center; gap: var(--gap-md); padding: 0 var(--gap-md); height: var(--topbar-height); border-bottom: 1px solid var(--muted); }
.navbar-vertical { display: flex; flex-direction: column; gap: var(--gap-xs); padding: var(--gap-sm); border-right: 1px solid var(--muted); background: var(--white); }
.nav-item { padding: 8px 12px; font-size: 14px; color: var(--text-secondary); text-decoration: none; border-radius: var(--radius); cursor: pointer; }
.nav-item:hover { background: var(--light); }
.nav-item.active { color: var(--text-primary); font-weight: 700; background: var(--light); }

/* ===== Breadcrumbs ===== */
.breadcrumbs { display: flex; align-items: center; gap: var(--gap-xs); font-size: 14px; color: var(--text-secondary); }
.breadcrumbs > *:not(:last-child)::after { content: "/"; margin-left: var(--gap-xs); color: var(--text-muted); }
.breadcrumbs > *:last-child { color: var(--text-primary); font-weight: 700; }

/* ===== Tabs ===== */
.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--muted); }
.tab { padding: 8px 16px; font-size: 14px; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tab:hover { color: var(--text-primary); }
.tab.active { color: var(--text-primary); font-weight: 700; border-bottom-color: var(--dark); }

/* ===== Table ===== */
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--muted); }
.table th { background: var(--light); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-secondary); }
.table tbody tr:hover { background: var(--light); }

/* ===== Forms ===== */
.form-group { display: flex; flex-direction: column; gap: var(--gap-xs); }
.form-group label { font-size: 14px; font-weight: 700; color: var(--text-secondary); }
input, select, textarea { font-family: inherit; font-size: 14px; padding: 8px 12px; border: 1px solid var(--muted); border-radius: var(--radius); background: var(--white); color: var(--text-primary); line-height: 1.5; }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--medium); outline-offset: -1px; }
textarea { min-height: 80px; resize: vertical; }
.form-actions { display: flex; justify-content: flex-end; gap: var(--gap-sm); }

/* Buttons */
.btn { font-family: inherit; font-size: 14px; font-weight: 700; padding: 8px 16px; border: 1px solid var(--muted); border-radius: var(--radius); background: var(--white); color: var(--text-primary); cursor: pointer; }
.btn:hover { background: var(--light); }
.btn-primary { background: var(--dark); color: var(--text-inverse); border-color: var(--dark); }
.btn-primary:hover { background: var(--black); }
.btn-ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--light); color: var(--text-primary); }

/* ===== Modal ===== */
.modal { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal > .card { min-width: 320px; max-width: 480px; }

/* ===== Toast ===== */
.toast { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: var(--dark); color: var(--text-inverse); padding: 10px 20px; border-radius: var(--radius); font-size: 14px; z-index: 101; }

/* ===== Toolbar ===== */
.toolbar { display: flex; align-items: center; gap: var(--gap-sm); flex-wrap: wrap; }
.toolbar input { flex: 1; min-width: 120px; }

/* ===== Stat ===== */
.stat { text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }

/* ===== Avatar ===== */
.avatar { display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: var(--muted); flex-shrink: 0; }
.avatar-sm { width: 24px; height: 24px; }
.avatar-lg { width: 48px; height: 48px; }

/* ===== Badge ===== */
.badge { display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: var(--light); color: var(--text-secondary); white-space: nowrap; }
.badge-outline { background: transparent; border: 1px solid var(--muted); }

/* ===== Stepper ===== */
.stepper { display: flex; align-items: center; gap: 0; }
.step { font-size: 13px; color: var(--text-muted); padding: 6px 12px; position: relative; }
.step:not(:last-child)::after { content: ""; display: inline-block; width: 24px; height: 2px; background: var(--muted); vertical-align: middle; margin-left: 8px; }
.step.active { color: var(--text-primary); font-weight: 700; }
.step.completed { color: var(--text-secondary); }

/* ===== Empty State ===== */
.empty-state { text-align: center; padding: var(--gap-xl); display: flex; flex-direction: column; align-items: center; gap: var(--gap-sm); }

/* ===== Divider ===== */
.divider { border: none; border-top: 1px solid var(--muted); margin: var(--gap-md) 0; }

/* ===== List ===== */
.list { display: flex; flex-direction: column; border: 1px solid var(--muted); border-radius: var(--radius); overflow: hidden; }
.list-item { display: flex; align-items: center; gap: var(--gap-sm); padding: 10px var(--gap-md); border-bottom: 1px solid var(--muted); }
.list-item:last-child { border-bottom: none; }

/* ===== Placeholders ===== */
[class*="placeholder-"] { background: var(--muted); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; min-height: 48px; position: relative; overflow: hidden; }
.placeholder-xs { height: 48px; }
.placeholder-sm { height: 96px; }
.placeholder-md { height: 192px; }
.placeholder-lg { height: 320px; }
.placeholder-xl { height: 480px; }
.placeholder-square { aspect-ratio: 1; }
.placeholder-video-ratio { aspect-ratio: 16/9; }

/* Placeholder type icons via ::before */
.placeholder-image::before { content: "\\1F5BC"; font-size: 24px; margin-right: 6px; }
.placeholder-video::before { content: "\\25B6"; font-size: 24px; margin-right: 6px; }
.placeholder-chart-bar::before { content: "\\2581\\2583\\2585\\2587\\2585\\2583"; font-size: 20px; margin-right: 6px; letter-spacing: 2px; }
.placeholder-chart-line::before { content: "\\2571\\2572\\2571\\2572"; font-size: 18px; margin-right: 6px; }
.placeholder-chart-pie::before { content: "\\25D4"; font-size: 28px; margin-right: 6px; }
.placeholder-chart-donut::before { content: "\\25CE"; font-size: 28px; margin-right: 6px; }
.placeholder-map::before { content: "\\1F4CD"; font-size: 20px; margin-right: 6px; }
.placeholder-calendar::before { content: "\\1F4C5"; font-size: 20px; margin-right: 6px; }
.placeholder-file::before { content: "\\1F4C4"; font-size: 20px; margin-right: 6px; }
.placeholder-audio::before { content: "\\266B"; font-size: 20px; margin-right: 6px; }
.placeholder-code::before { content: "</>"; font-size: 16px; margin-right: 6px; font-family: monospace; }
.placeholder-text::before { content: "\\2261"; font-size: 28px; margin-right: 6px; }
.placeholder-chat::before { content: "\\1F4AC"; font-size: 20px; margin-right: 6px; }
.placeholder-logo { width: 32px; height: 32px; border-radius: var(--radius); min-height: 0; }
.placeholder-logo::before { content: "\\25C6"; font-size: 16px; margin: 0; }
.placeholder-avatar { border-radius: 50%; width: 48px; height: 48px; min-height: 0; }
.placeholder-icon { width: 24px; height: 24px; min-height: 0; border-radius: var(--radius); }
.placeholder-progress { height: 8px; min-height: 8px; border-radius: 4px; background: var(--light); position: relative; }
.placeholder-progress::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 60%; background: var(--medium); border-radius: 4px; }
.placeholder-rating::before { content: "\\2606\\2606\\2606\\2606\\2606"; font-size: 18px; letter-spacing: 2px; margin: 0; }

/* ===== Annotations ===== */
.annotation { border: 2px dashed var(--medium); background: #FAFAF5; padding: var(--gap-sm) var(--gap-md); font-size: 13px; font-style: italic; color: var(--text-secondary); border-radius: var(--radius); margin: var(--gap-sm) 0; }
.annotation-inline { font-size: 11px; font-style: italic; color: var(--text-muted); }
`;
