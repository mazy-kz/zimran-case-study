import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const root = process.cwd();
const outputDir = path.join(root, "deliverables");
const previewDir = path.join(root, "tmp", "deck-final-previews");
const outputPath = path.join(outputDir, "Spotify_Growth_Engine_Analysis.pptx");

const W = 1280;
const H = 720;
const BLACK = "#0B0B0B";
const GREEN = "#1DB954";
const GREEN_DARK = "#11813B";
const WHITE = "#FFFFFF";
const PALE = "#F2F2F2";
const MID = "#B8BCC4";
const TEXT2 = "#555B66";

const deck = Presentation.create({ slideSize: { width: W, height: H } });

function addShape(slide, name, position, fill = "none", geometry = "rect", line = { style: "solid", fill: "none", width: 0 }) {
  return slide.shapes.add({ geometry, name, position, fill, line });
}

function addText(slide, name, text, position, style = {}) {
  const box = addShape(slide, name, position, "none", "textbox");
  box.text = text;
  box.text.style = {
    fontSize: style.fontSize ?? 24,
    typeface: "Arial",
    color: style.color ?? BLACK,
    bold: style.bold ?? false,
    italic: style.italic ?? false,
    alignment: style.alignment ?? "left",
    verticalAlignment: style.verticalAlignment ?? "top",
    autoFit: style.autoFit ?? "shrinkText",
    insets: style.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return box;
}

function addTitle(slide, title, number) {
  addText(slide, `title-${number}`, title, { left: 42, top: 35, width: 1135, height: 66 }, { fontSize: 48, bold: true });
  addShape(slide, `title-rule-${number}`, { left: 42, top: 113, width: 1196, height: 2 }, MID);
  addText(slide, `page-${number}`, String(number).padStart(2, "0"), { left: 1187, top: 661, width: 50, height: 22 }, { fontSize: 14, color: TEXT2, alignment: "right" });
}

function addSourceFooter(slide, text) {
  addText(slide, `source-footer-${deck.slides.items.length}`, text, { left: 42, top: 659, width: 1050, height: 28 }, { fontSize: 12, color: TEXT2 });
}

function addNotes(slide, urls, note = "") {
  slide.speakerNotes.textFrame.setText(`${note}${note ? "\n\n" : ""}[Sources]\n${urls.map((url) => `- ${url}`).join("\n")}`);
}

// 1. Cover.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addShape(slide, "cover-green-field", { left: 658, top: 0, width: 622, height: 720 }, GREEN);
  addShape(slide, "cover-black-disc", { left: 815, top: 120, width: 310, height: 310 }, BLACK, "ellipse");
  addText(slide, "cover-mark", "SPOTIFY", { left: 846, top: 244, width: 250, height: 70 }, { fontSize: 44, bold: true, color: WHITE, alignment: "center", verticalAlignment: "middle" });
  addText(slide, "cover-title", "Spotify's growth engine", { left: 42, top: 66, width: 570, height: 170 }, { fontSize: 64, bold: true });
  addText(slide, "cover-subtitle", "How the freemium model acquires, converts and retains - and where the economics still constrain it", { left: 42, top: 300, width: 540, height: 190 }, { fontSize: 28, color: TEXT2 });
  addText(slide, "cover-date", "Zimran IT School case | September 2026", { left: 42, top: 625, width: 520, height: 30 }, { fontSize: 16, color: TEXT2 });
  addNotes(slide, ["https://www.spotify.com/us/premium/", "https://newsroom.spotify.com/2026-08-04/spotify-q2-2026-earnings/"], "Scope: public information available through Q2 2026. Pricing shown for the U.S. market.");
}

// 2. Business model overview.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "The free tier is distribution; Premium monetizes the habit", 2);
  addText(slide, "model-lead", "A two-sided audio platform uses a broad, ad-supported audience to create conversion inventory, listening data and cultural relevance - then captures most revenue through subscriptions.", { left: 42, top: 142, width: 1160, height: 74 }, { fontSize: 24, color: TEXT2 });
  const stages = [
    ["1", "Acquire", "Free access, creator catalog, device ubiquity and partnerships reduce the cost of first use."],
    ["2", "Learn", "Every session improves recommendations, playlists and the perceived cost of switching."],
    ["3", "Monetize", "Premium removes friction; ads monetize users who remain free."],
  ];
  stages.forEach(([n, heading, body], i) => {
    const left = 42 + i * 401;
    addShape(slide, `model-panel-${i}`, { left, top: 260, width: 365, height: 285 }, i === 2 ? GREEN : PALE, "roundRect");
    addText(slide, `model-number-${i}`, n, { left: left + 26, top: 282, width: 50, height: 55 }, { fontSize: 38, bold: true, color: i === 2 ? WHITE : GREEN_DARK });
    addText(slide, `model-heading-${i}`, heading, { left: left + 26, top: 350, width: 310, height: 46 }, { fontSize: 30, bold: true, color: i === 2 ? WHITE : BLACK });
    addText(slide, `model-body-${i}`, body, { left: left + 26, top: 420, width: 310, height: 105 }, { fontSize: 19, color: i === 2 ? WHITE : TEXT2 });
  });
  addText(slide, "model-price", "U.S. Premium: Individual $12.99 | Student $6.99 | Duo $18.99 | Family $21.99", { left: 42, top: 588, width: 1160, height: 34 }, { fontSize: 20, bold: true });
  addSourceFooter(slide, "Sources: Spotify Premium (current U.S. pricing); Spotify Q2 2026 shareholder update");
  addNotes(slide, ["https://www.spotify.com/us/premium/", "https://www.sec.gov/Archives/edgar/data/1639920/000114036126031044/ef20078867_ex99-1.htm"]);
}

// 3. Metrics and benchmark.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "Scale compounds faster than the market; free grows faster", 3);
  const metrics = [
    ["777M", "MAUs", "+12% YoY"],
    ["300M", "Premium subscribers", "+9% YoY"],
    ["€4.78B", "Quarterly revenue", "+14% YoY"],
    ["33.4%", "Gross margin", "+193 bps YoY"],
  ];
  metrics.forEach(([value, label, change], i) => {
    const left = 42 + i * 298;
    addText(slide, `metric-value-${i}`, value, { left, top: 152, width: 270, height: 70 }, { fontSize: 48, bold: true, color: i === 3 ? GREEN_DARK : BLACK });
    addText(slide, `metric-label-${i}`, label, { left, top: 224, width: 270, height: 35 }, { fontSize: 18, bold: true });
    addText(slide, `metric-change-${i}`, change, { left, top: 264, width: 270, height: 30 }, { fontSize: 17, color: TEXT2 });
  });
  addShape(slide, "benchmark-panel", { left: 42, top: 338, width: 760, height: 263 }, PALE, "roundRect");
  addText(slide, "benchmark-title", "Benchmark read", { left: 72, top: 365, width: 310, height: 42 }, { fontSize: 28, bold: true });
  addText(slide, "benchmark-body", "Spotify revenue growth (14%) is more than twice 2025 global recorded-music growth (6.4%). Premium subscriber growth (9%) is broadly in line with global paid-streaming account growth (~9.6% from 2024 to 2025). The caveat: company quarterly growth and industry calendar-year growth are not perfectly matched periods.", { left: 72, top: 426, width: 688, height: 142 }, { fontSize: 21, color: TEXT2 });
  addShape(slide, "mix-panel", { left: 840, top: 338, width: 398, height: 263 }, BLACK, "roundRect");
  addText(slide, "mix-title", "Conversion proxy", { left: 870, top: 365, width: 330, height: 40 }, { fontSize: 26, bold: true, color: WHITE });
  addText(slide, "mix-value", "38.6%", { left: 870, top: 425, width: 330, height: 86 }, { fontSize: 58, bold: true, color: GREEN });
  addText(slide, "mix-body", "Premium subscribers / MAUs\nvs. 39.7% one year ago", { left: 870, top: 520, width: 330, height: 70 }, { fontSize: 19, color: WHITE });
  addSourceFooter(slide, "Sources: Spotify Q2 2026 update; IFPI Global Music Report 2026. Ratios calculated from reported figures.");
  addNotes(slide, ["https://www.sec.gov/Archives/edgar/data/1639920/000114036126031044/ef20078867_ex99-1.htm", "https://www.ifpi.org/global-music-report-2026-global-recorded-music-revenues-grow-6-4-as-record-companies-drive-innovation/"]);
}

// 4. Margin structure.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "Two-thirds of revenue still exits as cost of revenue", 4);
  slide.charts.add("bar", {
    position: { left: 42, top: 145, width: 580, height: 435 },
    categories: ["Q2 2025", "Q2 2026"],
    series: [
      { name: "Cost of revenue", categories: ["Q2 2025", "Q2 2026"], values: [68.5, 66.6], fill: "#B8BCC4" },
      { name: "Gross profit", categories: ["Q2 2025", "Q2 2026"], values: [31.5, 33.4], fill: GREEN },
    ],
    hasLegend: true,
    legend: { position: "bottom", overlay: false },
    dataLabels: { showValue: true },
    chartFill: WHITE,
    chartLine: { style: "solid", width: 0, fill: WHITE },
    plotAreaFill: { type: "none" },
    yAxis: { visible: true, min: 0, max: 100, majorUnit: 20, majorGridlines: { style: "solid", width: 1, fill: PALE }, textStyle: { typeface: "Arial", fontSize: 12, color: TEXT2 } },
    xAxis: { visible: true, textStyle: { typeface: "Arial", fontSize: 14, color: BLACK } },
    barOptions: { direction: "column", grouping: "stacked", gapWidth: 80 },
  });
  addText(slide, "margin-callout", "€3.18B", { left: 690, top: 160, width: 500, height: 80 }, { fontSize: 58, bold: true });
  addText(slide, "margin-sub", "Q2 2026 cost of revenue\n(€4.777B revenue - €1.596B gross profit)", { left: 690, top: 245, width: 500, height: 76 }, { fontSize: 22, color: TEXT2 });
  addText(slide, "margin-drivers", "What consumes it\n\n• Music royalties and higher licensor rates\n• Audiobook licensing and video-podcast costs\n• Payment processing and streaming delivery\n\nWhy margin improved\n\nRevenue grew faster than music costs; marketplace-program benefits and favorable podcast/tax effects helped.", { left: 690, top: 350, width: 500, height: 255 }, { fontSize: 19 });
  addSourceFooter(slide, "Sources: Spotify Q2 2026 shareholder update; Spotify 2025 Form 20-F");
  addNotes(slide, ["https://www.sec.gov/Archives/edgar/data/1639920/000114036126031044/ef20078867_ex99-1.htm", "https://www.sec.gov/Archives/edgar/data/1639920/000162828026006874/ck0001639920-20251231.htm"], "Cost-of-revenue share is the complement of reported gross margin. Q2 2026 cost is calculated from reported revenue and gross profit.");
}

// 5. Acquisition.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "Product distribution carries acquisition", 5);
  const channels = [
    ["Freemium", "Zero-price entry turns product usage into the top of funnel and creates a persistent upgrade surface."],
    ["Ecosystem", "Compatibility with 2,000+ devices puts Spotify in cars, speakers, TVs, consoles and wearables."],
    ["Partnerships", "Telco, hardware, creator and cultural partnerships bundle distribution with moments people already care about."],
    ["Paid / promo", "Free trials, brand advertising and events remain real costs, but Spotify does not disclose spend by channel."],
  ];
  channels.forEach(([heading, body], i) => {
    const top = 145 + i * 117;
    addText(slide, `channel-index-${i}`, `0${i + 1}`, { left: 42, top, width: 58, height: 36 }, { fontSize: 22, bold: true, color: GREEN_DARK });
    addText(slide, `channel-heading-${i}`, heading, { left: 120, top, width: 220, height: 38 }, { fontSize: 26, bold: true });
    addText(slide, `channel-body-${i}`, body, { left: 360, top, width: 835, height: 74 }, { fontSize: 20, color: TEXT2 });
    if (i < 3) addShape(slide, `channel-rule-${i}`, { left: 120, top: top + 86, width: 1080, height: 1 }, MID);
  });
  addShape(slide, "acq-answer", { left: 42, top: 608, width: 1155, height: 38 }, GREEN, "roundRect");
  addText(slide, "acq-answer-text", "Paid social supports the engine; freemium, ubiquity, partnerships and personalization are the moat.", { left: 62, top: 616, width: 1115, height: 23 }, { fontSize: 17, bold: true, color: WHITE, alignment: "center" });
  addNotes(slide, ["https://www.spotify.com/us/premium/", "https://www.sec.gov/Archives/edgar/data/1639920/000162828026006874/ck0001639920-20251231.htm", "https://www.sec.gov/Archives/edgar/data/1639920/000114036126031044/ef20078867_ex99-1.htm"], "Spotify reports aggregate sales and marketing expense, not a channel-level acquisition-spend split. The channel weighting is an evidence-based inference from product design and disclosures.");
}

// 6. Funnel.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "Three levers reduce conversion barriers", 6);
  const levers = [
    ["1", "Trial", "$0 for three months lets an eligible user experience Premium before paying $12.99/month.", "Moves: trial start → paid conversion"],
    ["2", "Friction removal", "Ad-free listening, offline downloads, full playback control and lossless audio make the benefit immediate.", "Moves: free → Premium intent"],
    ["3", "Segmented plans", "Student, Duo and Family plans price the same core utility around willingness to pay and household structure.", "Moves: checkout completion + retention"],
  ];
  levers.forEach(([n, heading, body, metric], i) => {
    const left = 42 + i * 401;
    addShape(slide, `lever-${i}`, { left, top: 155, width: 366, height: 407 }, i === 1 ? BLACK : PALE, "roundRect");
    addText(slide, `lever-n-${i}`, n, { left: left + 28, top: 180, width: 52, height: 55 }, { fontSize: 42, bold: true, color: GREEN });
    addText(slide, `lever-heading-${i}`, heading, { left: left + 28, top: 255, width: 310, height: 55 }, { fontSize: 31, bold: true, color: i === 1 ? WHITE : BLACK });
    addText(slide, `lever-body-${i}`, body, { left: left + 28, top: 330, width: 310, height: 130 }, { fontSize: 20, color: i === 1 ? WHITE : TEXT2 });
    addText(slide, `lever-metric-${i}`, metric, { left: left + 28, top: 485, width: 310, height: 55 }, { fontSize: 17, bold: true, color: GREEN });
  });
  addText(slide, "funnel-caveat", "Effectiveness ranking is inferred from funnel design; Spotify does not publish controlled lift by lever.", { left: 42, top: 595, width: 1160, height: 30 }, { fontSize: 17, italic: true, color: TEXT2 });
  addSourceFooter(slide, "Source: Spotify Premium U.S. plan page (current pricing and benefits)");
  addNotes(slide, ["https://www.spotify.com/us/premium/"], "The three levers are prioritized from publicly visible funnel mechanics. No causal lift percentages are claimed.");
}

// 7. Retention mechanic.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "Discover Weekly creates a Monday retention loop", 7);
  const nodes = [
    ["Listen", "Behavior reveals taste"],
    ["Model", "History + track relationships"],
    ["Refresh", "A new playlist every Monday"],
    ["Discover", "Novelty without search effort"],
  ];
  nodes.forEach(([heading, body], i) => {
    const left = 42 + i * 298;
    addShape(slide, `retention-node-${i}`, { left, top: 200, width: 260, height: 175 }, i === 2 ? GREEN : PALE, "roundRect");
    addText(slide, `retention-heading-${i}`, heading, { left: left + 22, top: 230, width: 216, height: 42 }, { fontSize: 27, bold: true, color: i === 2 ? WHITE : BLACK });
    addText(slide, `retention-body-${i}`, body, { left: left + 22, top: 292, width: 216, height: 62 }, { fontSize: 18, color: i === 2 ? WHITE : TEXT2 });
    if (i < 3) {
      addText(slide, `retention-arrow-${i}`, "→", { left: left + 260, top: 259, width: 38, height: 50 }, { fontSize: 34, bold: true, color: GREEN_DARK, alignment: "center" });
    }
  });
  addShape(slide, "retention-metric", { left: 42, top: 437, width: 1160, height: 139 }, BLACK, "roundRect");
  addText(slide, "retention-metric-title", "Primary metric: listening days per MAU", { left: 72, top: 465, width: 450, height: 45 }, { fontSize: 29, bold: true, color: WHITE });
  addText(slide, "retention-metric-body", "Leading: Monday opens, playlist starts, saves and completes.\nLagging: 28-day retention, churn and reactivation.", { left: 580, top: 463, width: 580, height: 76 }, { fontSize: 21, color: WHITE });
  addSourceFooter(slide, "Sources: Spotify Engineering - Discover Weekly launch and algotorial playlists");
  addNotes(slide, ["https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date", "https://engineering.atspotify.com/2023/04/humans-machines-a-look-behind-spotifys-algotorial-playlists"], "Spotify explicitly described weekly refresh as a path to habit formation. Metric mapping is analytical interpretation, not a published Spotify experiment result.");
}

// 8. Risks and trade-offs.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "The flywheel creates three strategic constraints", 8);
  const risks = [
    ["Rights-holder leverage", "Royalties scale with usage and contractual rates; 72% of label-delivered audio streams came from the three majors' affiliates plus Merlin-represented catalogs in 2025."],
    ["Monetization mix", "Ad-supported MAUs grew 14%, faster than Premium subscribers at 9%, while ad-supported revenue grew only 1% in Q2 2026."],
    ["Feature cost creep", "Audiobooks, video podcasts, creator payouts, cloud and AI deepen engagement but can dilute incremental margin if adoption outruns monetization."],
  ];
  risks.forEach(([heading, body], i) => {
    const top = 155 + i * 150;
    addText(slide, `risk-number-${i}`, `0${i + 1}`, { left: 42, top, width: 70, height: 46 }, { fontSize: 32, bold: true, color: GREEN_DARK });
    addText(slide, `risk-heading-${i}`, heading, { left: 140, top, width: 340, height: 45 }, { fontSize: 28, bold: true });
    addText(slide, `risk-body-${i}`, body, { left: 505, top, width: 695, height: 90 }, { fontSize: 20, color: TEXT2 });
    if (i < 2) addShape(slide, `risk-rule-${i}`, { left: 140, top: top + 112, width: 1060, height: 1 }, MID);
  });
  addSourceFooter(slide, "Sources: Spotify Q2 2026 shareholder update; Spotify 2025 Form 20-F");
  addNotes(slide, ["https://www.sec.gov/Archives/edgar/data/1639920/000114036126031044/ef20078867_ex99-1.htm", "https://www.sec.gov/Archives/edgar/data/1639920/000162828026006874/ck0001639920-20251231.htm"]);
}

// 9. Playbook.
{
  const slide = deck.slides.add();
  slide.background.fill = BLACK;
  addText(slide, "close-title", "What to copy - and what not to copy", { left: 42, top: 48, width: 1150, height: 90 }, { fontSize: 52, bold: true, color: WHITE });
  addShape(slide, "close-rule", { left: 42, top: 144, width: 1196, height: 2 }, GREEN);
  addText(slide, "copy-label", "COPY", { left: 42, top: 185, width: 165, height: 40 }, { fontSize: 22, bold: true, color: GREEN });
  addText(slide, "copy-body", "1. Let the free product prove value before asking for payment.\n\n2. Make personalization compound with every use.\n\n3. Price by segment and household, not one-size-fits-all.\n\n4. Build distribution into devices, partners and culture.", { left: 42, top: 246, width: 525, height: 305 }, { fontSize: 25, color: WHITE });
  addText(slide, "avoid-label", "DO NOT COPY BLINDLY", { left: 665, top: 185, width: 350, height: 40 }, { fontSize: 22, bold: true, color: GREEN });
  addText(slide, "avoid-body", "1. A free tier without a clear upgrade trigger.\n\n2. Engagement features without unit-economics gates.\n\n3. Paid acquisition judged on registrations instead of downstream contribution.\n\n4. Channel claims that the reporting cannot substantiate.", { left: 665, top: 246, width: 535, height: 305 }, { fontSize: 25, color: WHITE });
  addShape(slide, "close-strip", { left: 42, top: 595, width: 1158, height: 58 }, GREEN, "roundRect");
  addText(slide, "close-strip-text", "The durable lesson is not 'be Spotify.' It is to make acquisition, product value and retention reinforce the same economic loop.", { left: 65, top: 608, width: 1110, height: 34 }, { fontSize: 20, bold: true, color: BLACK, alignment: "center" });
  addNotes(slide, ["https://www.spotify.com/us/premium/", "https://www.sec.gov/Archives/edgar/data/1639920/000114036126031044/ef20078867_ex99-1.htm", "https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date"], "Recommendations synthesize the preceding evidence.");
}

// 10. Linked sources.
{
  const slide = deck.slides.add();
  slide.background.fill = WHITE;
  addTitle(slide, "Sources", 10);
  const sources = [
    ["Spotify Q2 2026 shareholder update", "https://newsroom.spotify.com/2026-08-04/spotify-q2-2026-earnings/"],
    ["Spotify 2025 Form 20-F", "https://www.sec.gov/Archives/edgar/data/1639920/000162828026006874/ck0001639920-20251231.htm"],
    ["Spotify Premium U.S. plans", "https://www.spotify.com/us/premium/"],
    ["IFPI Global Music Report 2026", "https://www.ifpi.org/global-music-report-2026-global-recorded-music-revenues-grow-6-4-as-record-companies-drive-innovation/"],
    ["Spotify Engineering: Discover Weekly", "https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date"],
    ["Spotify Engineering: algotorial playlists", "https://engineering.atspotify.com/2023/04/humans-machines-a-look-behind-spotifys-algotorial-playlists"],
  ];
  sources.forEach(([label, url], i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const left = 42 + col * 615;
    const top = 155 + row * 158;
    addText(slide, `source-label-${i}`, label, { left, top, width: 570, height: 34 }, { fontSize: 23, bold: true });
    addText(slide, `source-url-${i}`, url, { left, top: top + 48, width: 570, height: 76 }, { fontSize: 15, color: GREEN_DARK });
  });
  addText(slide, "source-note", "Figures and interpretations are current through Q2 2026. Calculation notes and full citations also appear in the slide speaker notes and repository README.", { left: 42, top: 620, width: 1110, height: 38 }, { fontSize: 17, italic: true, color: TEXT2 });
  addNotes(slide, sources.map(([, url]) => url), "External sources used in the analysis.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
for (let i = 0; i < deck.slides.items.length; i += 1) {
  const slide = deck.slides.items[i];
  const png = await deck.export({ slide, format: "png", scale: 1.4 });
  await fs.writeFile(path.join(previewDir, `slide-${i + 1}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(previewDir, `slide-${i + 1}.layout.json`), await layout.text(), "utf8");
}
const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(previewDir, "montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(outputPath);
const snapshot = await deck.inspect({ kind: "slide,textbox,shape,chart,notes", maxChars: 12000 });
await fs.writeFile(path.join(previewDir, "inspection.ndjson"), snapshot.ndjson, "utf8");
console.log(outputPath);
