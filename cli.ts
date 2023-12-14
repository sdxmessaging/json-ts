import { mkdirSync, writeFileSync } from "fs";
import { dirname, basename, relative, resolve } from "path";
import { Command } from "commander";
import { glob } from "glob";

interface ICliOpts {
	readonly source: string;
	readonly output: string;
	readonly pattern: string;
	readonly ignore: string | string[];
}

const program = new Command();
program
	.version("1.0.0")
	.option("-s, --source <path>", "Source directory")
	.option("-o, --output <path>", "Output directory")
	.option("-p, --pattern <glob>", "Match pattern")
	.option("-i, --ignore <globs...>", "Ignore pattern");

program.parse(process.argv);
const subDir = program.args.shift();
const {
	source,
	output,
	pattern = "**/*.ts",
	ignore = ["**/_*.ts", "**/*.part.ts"]
} = program.opts<ICliOpts>();

const cwd = process.cwd();
function fullPath(dir: string) {
	return subDir ? resolve(cwd, dir, subDir) : resolve(cwd, dir);
}

const srcDir = fullPath(source);
const outDir = fullPath(output);

async function exportFile(filePath: string) {
	// Get file path relative to source
	const srcPath = relative(srcDir, filePath);
	const outPath = resolve(
		// Resolve path to output directory
		dirname(resolve(outDir, srcPath)),
		// Rename file from .ts to .xml
		`${basename(filePath, ".ts").replace(".json", "")}.json`
	);
	// Import file and assert format
	const content = await import(filePath);
	if (!content.default) {
		throw new Error(`No exported default member, import ${filePath}`);
	}
	// Ensure directory
	mkdirSync(dirname(outPath), { recursive: true });
	// Write default export
	writeFileSync(outPath, JSON.stringify(content.default));
	console.debug("✔", srcPath, "→", relative(outDir, outPath));
}

glob(
	resolve(srcDir, pattern),
	{ ignore }
).then(async function (files) {
	console.debug(srcDir);
	console.debug(`Exporting ${files.length} files...`);
	for (const filePath of files) {
		try {
			await exportFile(filePath);
		} catch (err) {
			console.error(filePath);
			console.error(err);
			break;
		}
	}
}, function (err) {
	if (err) {
		console.debug(err);
		return;
	}
});
