const fs = require(fs);
const path = require(path);
const pkgPath = path.join(__dirname, .., web, package.json);
const pkg = JSON.parse(fs.readFileSync(pkgPath, utf8));
pkg.scripts = pkg.scripts || {};
pkg.scripts.dev = "next dev -p 3000";
pkg.scripts.typecheck = "tsc --noEmit";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + n);
console.log(Updated
