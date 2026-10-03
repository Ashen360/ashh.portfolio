// Builds the Word version of the resume. Run from the repo root:
//   node resume/build-docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, ExternalHyperlink, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, LevelFormat, PositionalTabAlignment,
  PositionalTabRelativeTo, PositionalTabLeader, TabStopType,
} = require("docx");

const INK = "111827", MUTED = "4B5563", ACCENT = "002168", RULE = "D9D8D4";
const BODY = "Calibri", SERIF = "Georgia";
const PAGE_W = 11906, PAGE_H = 16838, MX = 850, MT = 620, MB = 560;
const CONTENT_W = PAGE_W - MX * 2;

const run = (text, o = {}) => new TextRun({ text, font: BODY, size: 18, color: INK, ...o });
const link = (text, url, o = {}) =>
  new ExternalHyperlink({ link: url, children: [run(text, { color: MUTED, ...o })] });

const rightTab = () =>
  new TextRun({ children: [new (require("docx").PositionalTab)({
    alignment: PositionalTabAlignment.RIGHT,
    relativeTo: PositionalTabRelativeTo.MARGIN,
    leader: PositionalTabLeader.NONE,
  })] });

const heading = (text) =>
  new Paragraph({
    spacing: { before: 190, after: 90 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 2 } },
    keepNext: true,
    children: [run(text.toUpperCase(), { bold: true, size: 15, color: ACCENT, characterSpacing: 30 })],
  });

const titleLine = (title, role, right) =>
  new Paragraph({
    spacing: { before: 110, after: 0 },
    keepNext: true,
    children: [
      run(title, { bold: true, size: 19 }),
      ...(role ? [run(" / ", { color: MUTED }), run(role, { color: MUTED })] : []),
      ...(right ? [rightTab(), typeof right === "string" ? run(right, { size: 16, color: MUTED }) : right] : []),
    ],
  });

const stack = (t) =>
  new Paragraph({ spacing: { after: 20 }, keepNext: true, children: [run(t, { size: 16, color: ACCENT })] });

const bullet = (t) =>
  new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 20 }, children: [run(t)] });

const proj = (title, role, right, st, bullets) => [titleLine(title, role, right), stack(st), ...bullets.map(bullet)];

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none };

const contactLine = (a, b) =>
  new Paragraph({
    spacing: { after: 10 },
    tabStops: [{ type: TabStopType.LEFT, position: 3300 }],
    children: [run(a.t, { size: 17, color: MUTED }), run("\t"), b],
  });

const photo = fs.readFileSync(path.join(__dirname, "photo.png"));
const PHOTO_PX = 91; // 24mm

const header = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W - 1500, 1500],
  borders: { ...noBorders, insideHorizontal: none, insideVertical: none },
  rows: [new TableRow({ children: [
    new TableCell({
      width: { size: CONTENT_W - 1500, type: WidthType.DXA }, borders: noBorders,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: [
        new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Kurt Russel Hije Baybay", font: SERIF, size: 56, color: INK })] }),
        new Paragraph({ spacing: { after: 90 }, children: [run("Web Developer & Software Engineer", { bold: true, size: 21, color: ACCENT })] }),
        contactLine({ t: "Marikina City, Philippines" }, link("developer.ashen.it@gmail.com", "mailto:developer.ashen.it@gmail.com", { size: 17 })),
        contactLine({ t: "+63 976 309 0126" }, link("github.com/Ashen360", "https://github.com/Ashen360", { size: 17 })),
        contactLine({ t: "ashens-web.netlify.app" }, link("linkedin.com/in/kurt-baybay", "https://linkedin.com/in/kurt-baybay", { size: 17 })),
      ],
    }),
    new TableCell({
      width: { size: 1500, type: WidthType.DXA }, borders: noBorders,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        new ImageRun({ type: "png", data: photo, transformation: { width: PHOTO_PX, height: PHOTO_PX },
          altText: { title: "Photo", description: "Kurt Russel Baybay", name: "photo" } }),
      ] })],
    }),
  ] })],
});

const L = (t, u) => link(t, u, { size: 16 });

const children = [
  header,

  heading("Summary"),
  new Paragraph({ children: [run(
    "Information Technology student who builds interactive web applications with React and TypeScript, with additional work in Flutter, Java and C++. " +
    "Has shipped four live projects, including a webcam hand-tracking browser console and an interactive history of programming, " +
    "and built a no-code content management feature for a client web platform.", { size: 18 })] }),

  heading("Selected Projects"),
  ...proj("Webii", "Hand-tracking browser console", L("ashen360.github.io/Webii", "https://ashen360.github.io/Webii/"),
    "TypeScript · MediaPipe · Canvas 2D · Web Audio · Vite · Vitest", [
      "Built a browser console controlled by webcam: the index finger moves the cursor and a pinch acts as a click, with all tracking running locally in the browser.",
      "Designed calibration into onboarding, and shipped three Canvas 2D games and three themes.",
    ]),
  ...proj("Hello, Machine", "Interactive history of programming", L("ashen360.github.io/hello-machine", "https://ashen360.github.io/hello-machine/"),
    "HTML · CSS · JavaScript · Three.js · Canvas", [
      "Created a scrollytelling essay of seven chapters and a finale, 1837 to LLMs, each built from its era's medium: a punched card that spells HELLO, valves that set a byte, and a working BASIC terminal.",
      "Re-themes the whole page per era, with accessibility considered throughout. Written without a build step.",
    ]),
  ...proj("Cucina De Marquina CMS", "Versatily web ecosystem", "2024", "React · Express.js", [
    "Developed a content management feature that lets users create, edit and publish reviews through a no-code interface.",
    "Work as researcher and developer earned two SHS Expo section awards.",
  ]),
  ...proj("WordWeaver", "Category word puzzle", L("ashen360.github.io/WordWeaver", "https://ashen360.github.io/WordWeaver/"),
    "React · GitHub Pages", [
      "Built a puzzle game where players find groups of four related words in a shuffled grid, with difficulty levels from everyday topics to computer science concepts.",
    ]),
  ...proj("EasyRead", "Dyslexia support app", "Android", "Flutter · Dart", [
    "Developed a mobile app that runs locally and uses AI assistance to give students with dyslexia real-time text simplification, explanations and summaries.",
  ]),
  new Paragraph({ spacing: { before: 110 }, children: [
    run("Also built: ", { bold: true, size: 17 }),
    run("Sining Filipino, an interactive timeline of Philippine art (HTML, CSS, JavaScript) · Vremia, an Android scheduling and reminders app (Java) · Transactsys, a C++ console shop with cart and .txt receipts", { size: 17, color: MUTED }),
  ] }),

  heading("Technical Skills"),
  ...[
    ["Languages", "JavaScript, TypeScript, Python, Java, C#, C++, Dart"],
    ["Web & Mobile", "React, Next.js, Express.js, HTML, CSS, Three.js, MediaPipe, Flutter"],
    ["Databases", "MySQL, MongoDB, Supabase"],
    ["Tools", "Git, GitHub, Vite, Vitest, Vercel, VS Code, Visual Studio"],
  ].map(([k, v]) => new Paragraph({
    spacing: { after: 20 }, tabStops: [{ type: TabStopType.LEFT, position: 1500 }],
    children: [run(k, { bold: true }), run("\t"), run(v)],
  })),

  heading("Education"),
  ...[
    ["FEU Roosevelt Marikina", "BS Information Technology", "2025 – Present"],
    ["Technological Institute of the Philippines, Quezon City", "BS Information Technology", "2024 – 2025"],
    ["STI College Marikina", "SHS, Information Technology (Mobile App and Web Dev)", "2022 – 2024"],
  ].map(([s, d, y]) => new Paragraph({ spacing: { after: 30 }, children: [
    run(s, { bold: true, size: 19 }), run(" / ", { color: MUTED }), run(d, { color: MUTED }), rightTab(), run(y, { size: 16, color: MUTED }),
  ] })),

  heading("Awards"),
  ...[
    ["Top 10 Finalist, Innov8 Ideathon by Microsoft Student Community", "TIP Manila, 2024"],
    ["Best in Communication and Best Use of Expo Theme, SHS Expo", "STI College Marikina, 2024"],
    ["2nd Runner-up, Codefest Tagisan ng Talino", "2023"],
    ["3rd Place, Interdepartmental General Information and Current Events Quiz Bee", "TIP Quezon City"],
  ].map(([a, s]) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 30 }, children: [
    run(a), run(" · " + s, { color: MUTED }),
  ] })),
];

const doc = new Document({
  creator: "Kurt Russel Baybay",
  title: "Kurt Russel Baybay - Resume",
  styles: { default: { document: { run: { font: BODY, size: 18 } } } },
  numbering: { config: [{ reference: "bul", levels: [{
    level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 200, hanging: 200 } }, run: { color: ACCENT } },
  }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MT, bottom: MB, left: MX, right: MX } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "..", "src", "assets", "resume", "KurtRussel-Baybay-Resume.docx");
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
});
