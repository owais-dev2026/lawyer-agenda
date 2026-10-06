import type { AgendaData } from './types'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvCell(value: string) {
  const v = value ?? ''
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function toCSV(rows: string[][]) {
  return '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

const stamp = () => new Date().toISOString().slice(0, 10)

function esc(s: string) {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function exportJSON(data: AgendaData) {
  const payload = { ...data, exportedAt: new Date().toISOString(), app: 'lawyer-agenda' }
  download(`agenda-backup-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json')
}

export function exportPDF(data: AgendaData) {
  const exportedAt = new Date().toLocaleString('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const section = (title: string, body: string) =>
    `<section><h2>${esc(title)}</h2>${body || '<p class="empty">لا توجد بيانات</p>'}</section>`

  const sessionsRows = data.sessions
    .map(
      (s) =>
        `<tr>
          <td>${esc(s.clientName)}</td>
          <td>${esc(s.caseNumber)}</td>
          <td>${esc(s.court)}</td>
          <td dir="ltr">${esc(s.date)}</td>
          <td dir="ltr">${esc(s.time)}</td>
          <td>${s.status === 'completed' ? 'منتهية' : 'قيد الانتظار'}</td>
          <td>${esc(s.notes)}</td>
        </tr>`,
    )
    .join('')

  const clientsRows = data.clients
    .map(
      (c) =>
        `<tr>
          <td>${esc(c.name)}</td>
          <td dir="ltr">${esc(c.phone)}</td>
          <td>${esc(c.notes)}</td>
        </tr>`,
    )
    .join('')

  const sessionsTable = sessionsRows
    ? `<table><thead><tr>
          <th>الموكل</th><th>رقم القضية</th><th>المحكمة</th><th>التاريخ</th><th>الوقت</th><th>الحالة</th><th>ملاحظات</th>
        </tr></thead><tbody>${sessionsRows}</tbody></table>`
    : ''

  const clientsTable = clientsRows
    ? `<table><thead><tr><th>الاسم</th><th>الهاتف</th><th>ملاحظات</th></tr></thead><tbody>${clientsRows}</tbody></table>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>نسخة احتياطية — أجندة المحامي — ${stamp()}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", Arial, sans-serif;
    color: #2c2118; margin: 0; padding: 24px; line-height: 1.55; font-size: 13px; background: #fff;
  }
  header { margin-bottom: 16px; border-bottom: 3px solid #4a3423; padding-bottom: 10px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #4a3423; }
  .meta { color: #6b5a4a; font-size: 11px; margin: 0; }
  h2 { font-size: 14px; color: #4a3423; border-bottom: 2px solid #c4a574; padding-bottom: 4px; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #d4c4b0; padding: 6px 8px; text-align: right; vertical-align: top; }
  th { background: #f3ece0; font-weight: 600; color: #4a3423; }
  tr:nth-child(even) td { background: #faf7f2; }
  .empty { color: #888; font-style: italic; }
  .summary { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
  .chip { background: #f3ece0; border: 1px solid #d4c4b0; border-radius: 8px; padding: 8px 14px; }
  .chip strong { display: block; font-size: 18px; color: #4a3423; }
  .banner {
    background: #fff8e8; border: 1px solid #e0c48a; border-radius: 10px;
    padding: 10px 12px; margin-bottom: 14px; font-size: 12px; color: #5a4630;
  }
  @media print { body { padding: 10px; } .banner { display: none; } tr { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="banner">للحفظ كملف PDF على الهاتف: من القائمة اختر «طباعة» ثم «حفظ كـ PDF».</div>
  <header>
    <h1>أجندة المحامي — نسخة احتياطية</h1>
    <p class="meta">تاريخ التصدير: ${esc(exportedAt)}</p>
  </header>
  <div class="summary">
    <div class="chip"><strong>${data.sessions.length}</strong>جلسة</div>
    <div class="chip"><strong>${data.clients.length}</strong>موكل</div>
  </div>
  ${section('الجلسات', sessionsTable)}
  ${section('الموكلون', clientsTable)}
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body>
</html>`

  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) {
    download(`agenda-backup-${stamp()}.html`, html, 'text/html;charset=utf-8')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

export function exportBackup(data: AgendaData) {
  exportJSON(data)
  setTimeout(() => exportPDF(data), 400)
}

export function exportSessionsCSV(data: AgendaData) {
  const rows = [
    ['الموكل', 'رقم القضية', 'المحكمة', 'التاريخ', 'الوقت', 'الحالة', 'ملاحظات'],
    ...data.sessions.map((s) => [
      s.clientName,
      s.caseNumber,
      s.court,
      s.date,
      s.time,
      s.status === 'completed' ? 'منتهية' : 'قيد الانتظار',
      s.notes,
    ]),
  ]
  download(`agenda-sessions-${stamp()}.csv`, toCSV(rows), 'text/csv;charset=utf-8')
}

export function exportClientsCSV(data: AgendaData) {
  const rows = [
    ['الاسم', 'رقم الهاتف', 'ملاحظات'],
    ...data.clients.map((c) => [c.name, c.phone, c.notes]),
  ]
  download(`agenda-clients-${stamp()}.csv`, toCSV(rows), 'text/csv;charset=utf-8')
}
