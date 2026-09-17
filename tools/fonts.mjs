import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdf = await getDocument({ url: process.argv[2] || '../design/Landing Page - V01.ai', verbosity: 0 }).promise;
const page = await pdf.getPage(1);
const tc = await page.getTextContent();
const porFuente = {};
for (const it of tc.items) {
  if (!it.str || !it.str.trim()) continue;
  const fam = (tc.styles[it.fontName]?.fontFamily || it.fontName).replace(/^[A-Z]{6}\+/, '');
  const size = Math.round(Math.hypot(it.transform[0], it.transform[1]));
  const key = `${fam} @ ${size}px`;
  (porFuente[key] ??= []).push(it.str.trim().slice(0, 40));
}
for (const [k, v] of Object.entries(porFuente).sort()) {
  console.log(`\n${k}  (${v.length} items)`);
  console.log('   ' + [...new Set(v)].slice(0, 6).join(' | '));
}
