import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, "src", "icons");
const OUT_FILE = path.join(
  ROOT,
  "src",
  "components",
  "generated",
  "icons-map.ts"
);

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile() && p.endsWith(".svg")) out.push(p);
  }
  return out;
}

function toImportName(file: string) {
  // ico-home-outline.svg -> IcoHomeOutline
  const base = path.basename(file, ".svg");
  return base
    .replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase())
    .replace(/[^\w]/g, "");
}

function toIconKey(file: string) {
  // mantém o nome do arquivo como chave (ex: "ico-home-outline")
  return path.basename(file, ".svg");
}

async function main() {
  const files = (await walk(ICONS_DIR)).sort();
  const rel = files.map((f) =>
    path.relative(path.join(ROOT, "src"), f).replace(/\\/g, "/")
  );

  const imports = rel
    .map((r) => `import ${toImportName(r)} from "@/` + r + `";`)
    .join("\n");

  const mapEntries = rel
    .map((r) => {
      const name = toImportName(r);
      const key = toIconKey(r);
      return `  "${key}": ${name},`;
    })
    .join("\n");

  const out = `/* AUTO-GERADO: NÃO EDITAR MANUALMENTE */
${imports}

export const iconsMap = {
${mapEntries}
} as const;

export type IconName = keyof typeof iconsMap;
`;

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, out, "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
