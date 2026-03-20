export function categorizeIssue(issue) {
  const type = issue.fields?.issuetype?.name?.toLowerCase() || ''
  const summary = issue.fields?.summary?.toLowerCase() || ''

  if (type.includes('bug') || summary.includes('fix')) return 'bug'
  if (type.includes('feature') || type.includes('story') ||
      summary.includes('add') || summary.includes('new')) return 'feature'
  if (type.includes('improvement') || summary.includes('improve') ||
      summary.includes('enhance')) return 'improvement'
  if (type.includes('task') || type.includes('technical')) return 'technical'
  return 'other'
}

const LABELS = {
  sr: {
    feature: 'Nove funkcionalnosti',
    bug: 'Ispravke grešaka',
    improvement: 'Poboljšanja',
    technical: 'Tehničke izmene',
    other: 'Ostalo',
  },
  en: {
    feature: 'New Features',
    bug: 'Bug Fixes',
    improvement: 'Improvements',
    technical: 'Technical Changes',
    other: 'Other',
  },
}

const CATEGORY_ORDER = ['feature', 'bug', 'improvement', 'technical', 'other']

export function generateMarkdown(tasks, config) {
  if (!tasks || tasks.length === 0) return ''

  const lang = config.language === 'en' ? 'en' : 'sr'
  const labels = LABELS[lang]
  const date = new Date().toLocaleDateString(lang === 'sr' ? 'sr-Latn-RS' : 'en-US')

  const grouped = {}
  for (const task of tasks) {
    const cat = categorizeIssue(task)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(task)
  }

  const sections = []
  for (const cat of CATEGORY_ORDER) {
    if (!grouped[cat]?.length) continue
    const lines = [`### ${labels[cat]}`]
    for (const task of grouped[cat]) {
      const summary = task.fields?.summary || task.summary || ''
      lines.push(config.showKeys ? `- **${task.key}**: ${summary}` : `- ${summary}`)
      if (task.description) lines.push(`  *${task.description}*`)
    }
    sections.push(lines.join('\n'))
  }

  if (sections.length === 0) return ''

  const header = `# Release Notes - ${config.clientName || 'Klijent'}\n## ${config.version || 'v1.0'} — ${date}`
  return [header, ...sections].join('\n\n')
}

export function markdownToHtml(markdown, meta) {
  let body = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')

  // Wrap consecutive <li> in <ul>
  body = body.replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)

  // Double newlines → paragraph breaks
  body = body.replace(/\n\n+/g, '</p><p>')

  const date = new Date().toLocaleDateString(meta.language === 'sr' ? 'sr-Latn-RS' : 'en-US')

  return `<!DOCTYPE html>
<html lang="${meta.language || 'sr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Release Notes — ${meta.clientName || ''} ${meta.version || ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 40px;
      color: #1e293b;
      background: #fff;
      line-height: 1.65;
      font-size: 15px;
    }

    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #2563eb;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      font-size: 13px;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-bar span { opacity: 0.85; }
    .print-btn {
      background: #fff;
      color: #2563eb;
      border: none;
      border-radius: 6px;
      padding: 6px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-btn:hover { background: #e0e7ff; }

    .doc-wrap { margin-top: 52px; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      margin-bottom: 36px;
      border-bottom: 3px solid #2563eb;
    }
    .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .logo span { color: #1e293b; }
    .doc-meta { text-align: right; font-size: 13px; color: #64748b; line-height: 1.8; }
    .doc-meta strong { color: #1e293b; font-size: 15px; display: block; }

    h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    h2 {
      font-size: 17px; font-weight: 700; color: #2563eb;
      margin: 32px 0 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    h3 { font-size: 15px; font-weight: 600; color: #1e3a8a; margin: 24px 0 8px; }
    p { margin: 0 0 12px; }
    ul { padding-left: 22px; margin: 0 0 16px; }
    li { margin-bottom: 7px; }
    strong { font-weight: 600; }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }

    @media print {
      .print-bar { display: none !important; }
      .doc-wrap { margin-top: 0; }
      body { padding: 0; font-size: 13px; }
      h2 { page-break-after: avoid; }
      ul { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Release Notes — ${meta.clientName || ''} ${meta.version || ''}</span>
    <button class="print-btn" onclick="window.print()">🖨️ Sačuvaj kao PDF</button>
  </div>

  <div class="doc-wrap">
    <div class="header">
      <div>
        <img src="${meta.origin || ''}/logo-dark.png" alt="InteliSale" style="height:40px; display:block;">
      </div>
      <div class="doc-meta">
        <strong>${meta.clientName || ''}</strong>
        ${meta.productName ? `${meta.productName}<br>` : ''}
        ${meta.version || ''} &nbsp;·&nbsp; ${date}
      </div>
    </div>

    <p>${body}</p>

    <div class="footer">
      <p><strong>INTELISALE</strong> · Empowering Sales Excellence · www.intelisale.com</p>
    </div>
  </div>
</body>
</html>`
}
