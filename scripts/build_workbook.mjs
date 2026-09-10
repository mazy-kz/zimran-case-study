import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.cwd();
const inputPath = path.join(root, "data", "raw", "zimran_source.xlsx");
const outputDir = path.join(root, "deliverables");
const outputPath = path.join(outputDir, "Zimran_Partner_Economics.xlsx");
const previewDir = path.join(root, "tmp", "workbook-final-previews");

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const task = workbook.worksheets.getItem("Task 1");
const data = workbook.worksheets.getItem("Data");
const assumptions = workbook.worksheets.add("Assumptions");
const memo = workbook.worksheets.add("Decision Memo");

const campaigns = ["Partner #1 desktop", "Partner #1 mobile", "Partner #2"];
const partnerIds = ["1_desktop", "1_mobile", "2_cpc"];
const payouts = [9, 3.5, 0.33];
const arpu = [0.89, 1.81, 0.33];
const arppu = [44.88, 150.44, 31.21];
const impressions = [413596, 601127, 140325];
const mediaRates = [6.4, 2.34, 0.23];
const mediaBasis = ["CPM", "CPM", "CPC"];
const targetCountries = ["United States", "Canada", "United Kingdom", "Australia", "New Zealand"];
const mobileOs = ["Android", "iOS", "Blackberry", "Windows Phone"];

assumptions.showGridLines = false;
assumptions.getRange("A1:D1").merge();
assumptions.getRange("A1").values = [["Model assumptions and campaign mapping"]];
assumptions.getRange("A3:D3").values = [["Metric", ...campaigns]];
assumptions.getRange("A4:D12").values = [
  ["Partner ID", ...partnerIds],
  ["Payout to partner", ...payouts],
  ["ARPU - week 0", ...arpu],
  ["ARPPU - week 0", ...arppu],
  ["Desktop return multiplier", 8.3, 8.3, 8.3],
  ["Mobile return multiplier", 4, 4, 4],
  ["Impressions", ...impressions],
  ["Partner media rate", ...mediaRates],
  ["Partner media basis", ...mediaBasis],
];
assumptions.getRange("A14:D14").values = [["Registered device mix", ...campaigns]];
assumptions.getRange("A15:A16").values = [["Desktop registrations"], ["Mobile registrations"]];
for (let column = 0; column < 3; column += 1) {
  const excelColumn = String.fromCharCode(66 + column);
  assumptions.getRange(`${excelColumn}15`).formulas = [[
    `=COUNTIFS('Data'!$C$3:$C$14968,${excelColumn}$4,'Data'!$B$3:$B$14968,"<>",'Data'!$G$3:$G$14968,"<>Android",'Data'!$G$3:$G$14968,"<>iOS",'Data'!$G$3:$G$14968,"<>Blackberry",'Data'!$G$3:$G$14968,"<>Windows Phone")`,
  ]];
  const mobileTerms = mobileOs.map(
    (osName) => `COUNTIFS('Data'!$C$3:$C$14968,${excelColumn}$4,'Data'!$B$3:$B$14968,"<>",'Data'!$G$3:$G$14968,"${osName}")`,
  );
  assumptions.getRange(`${excelColumn}16`).formulas = [[`=${mobileTerms.join("+")}`]];
}
assumptions.getRange("A18:A18").values = [["Qualified-lead countries"]];
assumptions.getRange("A19:A23").values = targetCountries.map((country) => [country]);
assumptions.getRange("A25:D27").values = [
  ["Method note", null, null, null],
  ["Partner 2 six-month income", "Week-0 ARPU is allocated evenly across registered users, then desktop/mobile multipliers are applied to the observed registered-device mix.", null, null],
  ["Statistical interpretation", "Conversion-rate differences are associations in a one-week observational sample, not causal lift estimates.", null, null],
];
assumptions.getRange("B26:D26").merge();
assumptions.getRange("B27:D27").merge();

const inputFormulaColumns = ["C", "D", "E"];
for (let index = 0; index < inputFormulaColumns.length; index += 1) {
  const col = inputFormulaColumns[index];
  const sourceCol = String.fromCharCode(66 + index);
  task.getRange(`${col}5`).formulas = [[`='Assumptions'!${sourceCol}5`]];
  task.getRange(`${col}6`).formulas = [[`=COUNTIF('Data'!$C$3:$C$14968,'Assumptions'!${sourceCol}$4)`]];
  task.getRange(`${col}7`).formulas = [[`=COUNTIFS('Data'!$C$3:$C$14968,'Assumptions'!${sourceCol}$4,'Data'!$B$3:$B$14968,"<>")`]];
  const leadTerms = targetCountries.map(
    (_, countryIndex) => `COUNTIFS('Data'!$C$3:$C$14968,'Assumptions'!${sourceCol}$4,'Data'!$B$3:$B$14968,"<>",'Data'!$D$3:$D$14968,'Assumptions'!$A$${19 + countryIndex},'Data'!$E$3:$E$14968,">=35",'Data'!$F$3:$F$14968,"male")`,
  );
  task.getRange(`${col}8`).formulas = [[`=${leadTerms.join("+")}`]];
  task.getRange(`${col}9`).formulas = [[`=${col}7/${col}6`]];
  task.getRange(`${col}10`).formulas = [[`=ROUND(${col}13/${col}12,0)`]];
  task.getRange(`${col}11`).formulas = [[`='Assumptions'!${sourceCol}6`]];
  task.getRange(`${col}12`).formulas = [[`='Assumptions'!${sourceCol}7`]];
  task.getRange(`${col}13`).formulas = [[`=${col}7*${col}11`]];
  task.getRange(`${col}14`).formulas = [[`='Assumptions'!${sourceCol}15*${col}11*'Assumptions'!${sourceCol}8+'Assumptions'!${sourceCol}16*${col}11*'Assumptions'!${sourceCol}9`]];
  task.getRange(`${col}15`).formulas = [[index < 2 ? `=${col}8*${col}5` : `=${col}6*${col}5`]];
  task.getRange(`${col}16`).formulas = [[`=(${col}14-${col}15)/${col}15`]];
}

const table2Cols = ["I", "J", "K"];
for (let index = 0; index < table2Cols.length; index += 1) {
  const col = table2Cols[index];
  const task1Col = inputFormulaColumns[index];
  const sourceCol = String.fromCharCode(66 + index);
  task.getRange(`${col}5`).formulas = [[`='Assumptions'!${sourceCol}10`]];
  task.getRange(`${col}6`).formulas = [[`=${task1Col}6`]];
  task.getRange(`${col}7`).formulas = [[index < 2 ? `='Assumptions'!${sourceCol}11` : `=${col}10/${col}5*1000`]];
  task.getRange(`${col}8`).formulas = [[`=${col}6/${col}5`]];
  task.getRange(`${col}9`).formulas = [[`=${col}10/${col}6`]];
  task.getRange(`${col}10`).formulas = [[index < 2 ? `=${col}5/1000*${col}7` : `=${col}6*'Assumptions'!${sourceCol}11`]];
  task.getRange(`${col}11`).formulas = [[`=${task1Col}8`]];
  task.getRange(`${col}12`).formulas = [[index < 2 ? `=${col}11*${task1Col}5` : `=${col}6*${task1Col}5`]];
  task.getRange(`${col}13`).formulas = [[`=${col}12-${col}10`]];
  task.getRange(`${col}14`).formulas = [[`=${col}13/${col}10`]];
}

task.showGridLines = false;
task.getRange("B1:K1").merge();
task.getRange("B1").values = [["Partner economics - completed decision model"]];
task.getRange("B2:K2").merge();
task.getRange("B2").values = [["Green cells are model outputs. Blue cells are supplied or explicit assumptions. ROI is shown from both zimran.test and partner viewpoints."]];
task.getRange("B1:K1").format.fill = "#111111";
task.getRange("B1:K1").format.font = { bold: true, color: "#FFFFFF", size: 16 };
task.getRange("B2:K2").format.font = { italic: true, color: "#555555", size: 10 };
task.getRange("B1:K2").format.wrapText = true;
task.getRange("C5:E5").format.fill = "#D9EAF7";
task.getRange("I5:K9").format.fill = "#D9EAF7";
task.getRange("C6:E16").format.fill = "#E2F0D9";
task.getRange("I10:K14").format.fill = "#E2F0D9";
task.getRange("C5:E5").format.numberFormat = "$0.00";
task.getRange("C9:E9").format.numberFormat = "0.00%";
task.getRange("C11:E15").format.numberFormat = "$#,##0.00";
task.getRange("C16:E16").format.numberFormat = "0.0%";
task.getRange("I5:K6").format.numberFormat = "#,##0";
task.getRange("I7:K7").format.numberFormat = "$0.00";
task.getRange("I8:K8").format.numberFormat = "0.00%";
task.getRange("I9:K13").format.numberFormat = "$#,##0.00";
task.getRange("I11:K11").format.numberFormat = "#,##0";
task.getRange("I14:K14").format.numberFormat = "0.0%";
task.getRange("B1:K16").format.rowHeight = 22;
task.getRange("B1:K2").format.rowHeight = 30;
task.freezePanes.freezeRows(4);

memo.showGridLines = false;
memo.getRange("A1:F1").merge();
memo.getRange("A1").values = [["Decision memo - who should keep whom?"]];
memo.getRange("A3:F3").values = [["Campaign", "LP conversion", "Lead quality", "zimran.test ROI", "Partner ROI", "Decision"]];
memo.getRange("A4:A6").values = campaigns.map((name) => [name]);
for (let i = 0; i < 3; i += 1) {
  const row = 4 + i;
  const taskCol = inputFormulaColumns[i];
  const partnerCol = table2Cols[i];
  memo.getRange(`B${row}`).formulas = [[`='Task 1'!${taskCol}9`]];
  memo.getRange(`C${row}`).formulas = [[`='Task 1'!${taskCol}8/'Task 1'!${taskCol}7`]];
  memo.getRange(`D${row}`).formulas = [[`='Task 1'!${taskCol}16`]];
  memo.getRange(`E${row}`).formulas = [[`='Task 1'!${partnerCol}14`]];
  const decisions = [
    "Renegotiate CPA to <= $8.00 or pause; current projected loss is about $326.",
    "Scale carefully for zimran.test; partner needs CPM <= $1.85 or better CTR to continue.",
    "Keep on a monitored test only; zimran.test has just 2.4% ROI and $0.008 CPC headroom.",
  ];
  memo.getRange(`F${row}`).values = [[decisions[i]]];
}
memo.getRange("A8:F8").merge();
memo.getRange("A8").values = [["Why landing-page conversion differs"]];
memo.getRange("A9:F10").merge();
memo.getRange("A9").values = [["Observed conversion is 15.07% for Partner 2, 10.18% for Partner 1 desktop, and 8.28% for Partner 1 mobile. Every pairwise difference is statistically significant (two-proportion tests, p < 0.005), but the data are observational. Likely drivers are traffic intent/source mix, landing-page fit, and mobile friction. Partner 2 converts more visitors but produces a lower qualified-lead share (80.83%) than desktop (92.35%) or mobile (95.20%), mainly because more registrants are under 35."]];
memo.getRange("A12:F12").merge();
memo.getRange("A12").values = [["Concrete optimization plan"]];
memo.getRange("A13:B16").values = [
  ["Partner 1 desktop", "Cut CPA from $9.00 to <= $8.00, or lift projected revenue per lead by at least 12.5%. Exclude low-value placements and retain sources with paid-user conversion above the campaign median."],
  ["Partner 1 mobile", "Keep the campaign for zimran.test. For partner viability, reduce media CPM from $2.34 to <= $1.85, improve CTR from 0.67%, or renegotiate payout upward. A mobile-first landing experiment should target the 1.90 pp conversion gap versus desktop."],
  ["Partner 2", "Cap effective CPC at $0.33 and use a stricter operating guardrail of <= $0.30. Age-prequalify before the paid click where possible; current client break-even is $0.338 per click, leaving only 2.4% ROI."],
  ["Experiment design", "Randomize landing variants within each partner/device, preserve source tags, and decide on qualified-lead rate and projected six-month contribution - not registration rate alone. Run until each arm has enough registrations to detect a 1.5-2.0 pp change."],
];
memo.getRange("A18:F18").merge();
memo.getRange("A18").values = [["How Table 1 changes flow into Table 2"]];
memo.getRange("A19:F20").merge();
memo.getRange("A19").values = [["Improving landing conversion increases registrations and usually qualified leads. Under CPA, that raises both zimran.test traffic cost and the partner's affiliate income, so quality and downstream revenue must improve faster than payouts. Under CPC, zimran.test pays for clicks regardless of conversion; therefore every incremental qualified registration improves client ROI while partner revenue is unchanged. A faster landing page can also improve partner economics indirectly if ad platforms reward engagement with lower CPM/CPC."]];
memo.getRange("A22:F22").merge();
memo.getRange("A22").values = [["Data audit and caveats"]];
memo.getRange("A23:F25").merge();
memo.getRange("A23").values = [["14,966 unique clicks and 1,813 unique registrations; no duplicate click IDs or registered profile IDs; registered rows have complete age and gender. Missing age/gender on 13,153 rows is structurally expected because those visitors did not register. The one-week sample does not identify creative, placement, timestamp, or revenue at user level. Partner 2's six-month projection assumes its aggregate week-0 ARPU applies evenly across its observed registered desktop/mobile mix (733/394). Validate that allocation before scaling."]];

for (const titleRange of ["A1:F1", "A8:F8", "A12:F12", "A18:F18", "A22:F22"]) {
  memo.getRange(titleRange).format.fill = titleRange === "A1:F1" ? "#111111" : "#1DB954";
  memo.getRange(titleRange).format.font = { bold: true, color: "#FFFFFF", size: titleRange === "A1:F1" ? 18 : 12 };
}
memo.getRange("A3:F3").format.fill = "#D9EAF7";
memo.getRange("A3:F3").format.font = { bold: true, color: "#111111" };
memo.getRange("A3:F6").format.borders = { preset: "all", style: "thin", color: "#B8BCC4" };
memo.getRange("B4:E6").format.numberFormat = "0.00%";
memo.getRange("A1:F25").format.wrapText = true;
memo.getRange("A1:F25").format.verticalAlignment = "top";
memo.getRange("A:F").format.columnWidth = 18;
memo.getRange("F:F").format.columnWidth = 38;
memo.getRange("A9:F10").format.rowHeight = 44;
memo.getRange("A13:A16").format.font = { bold: true };
memo.getRange("A13:A16").format.columnWidth = 22;
memo.getRange("B13:B16").format.columnWidth = 80;
memo.getRange("A13:B16").format.rowHeight = 58;
memo.getRange("A19:F20").format.rowHeight = 44;
memo.getRange("A23:F25").format.rowHeight = 44;
memo.freezePanes.freezeRows(3);

assumptions.getRange("A1:D1").format.fill = "#111111";
assumptions.getRange("A1:D1").format.font = { bold: true, color: "#FFFFFF", size: 16 };
assumptions.getRange("A3:D3").format.fill = "#D9EAF7";
assumptions.getRange("A3:D3").format.font = { bold: true };
assumptions.getRange("A14:D14").format.fill = "#1DB954";
assumptions.getRange("A14:D14").format.font = { bold: true, color: "#FFFFFF" };
assumptions.getRange("A1:D27").format.wrapText = true;
assumptions.getRange("A:A").format.columnWidth = 28;
assumptions.getRange("B:D").format.columnWidth = 24;
assumptions.getRange("B5:D7").format.numberFormat = "$0.00";
assumptions.getRange("B10:D10").format.numberFormat = "#,##0";
assumptions.freezePanes.freezeRows(3);

data.freezePanes.freezeRows(2);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

for (const [sheetName, range] of [["Task 1", "B1:K16"], ["Decision Memo", "A1:F25"], ["Assumptions", "A1:D27"], ["Data", "A1:J35"], ["Glossary", "A1:L14"]]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.3, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName.replace(/[^a-z0-9]+/gi, "-")}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const check = await workbook.inspect({ kind: "table", sheetId: "Task 1", range: "B4:K16", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 12, maxChars: 12000 });
console.log(check.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log(errors.ndjson);
console.log(outputPath);
