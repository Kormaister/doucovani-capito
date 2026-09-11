const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const publicFiles = [
  "index.html",
  "o-nas.html",
  "doucovani-mechaniky.html",
  "doucovani-fyziky.html",
  "doucovani-matematiky.html",
  "doucovani-cestiny.html",
  "doucovani-ekonomiky.html",
  "doucovani-marketingu-a-managementu.html",
  "doucovani-verejne-spravy.html",
  "priprava-na-prijimacky.html",
  "priprava-na-maturitu.html",
  "zasady-zpracovani-osobnich-udaju.html",
  "rezervacni-a-storno-podminky.html",
  "404.html",
  "google8867335662e2e630.html",
  "robots.txt",
  "sitemap.xml",
  "styles.css",
  "script.js",
  "_headers",
  "_redirects",
];

const publicDirectories = ["assets"];

const removeDirectory = (target) => {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

const copyFile = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const copyDirectory = (source, target) => {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
};

removeDirectory(dist);
fs.mkdirSync(dist, { recursive: true });

for (const file of publicFiles) {
  copyFile(path.join(root, file), path.join(dist, file));
}

for (const directory of publicDirectories) {
  copyDirectory(path.join(root, directory), path.join(dist, directory));
}

console.log(`Public web built in ${path.relative(root, dist)}/`);
