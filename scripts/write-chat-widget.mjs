import fs from "fs";
const c = process.argv[2];
fs.writeFileSync("src/components/ChatWidget.astro", c);
console.log("Written", c.length, "bytes");
