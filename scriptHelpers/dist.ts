const shell = require("shelljs");
const currentVersion = require("../package.json").version;

const enum versionBump {
	MAJOR = "major",
	MINOR = "minor",
	PATCH = "patch"
}

const bumpType = process.argv.reduce<versionBump>((acc, arg) => {
	switch (arg.toLowerCase()) {
		case versionBump.MAJOR: return versionBump.MAJOR;
		case versionBump.MINOR: return versionBump.MINOR;
		default: return acc;
	}
}, versionBump.PATCH);

const bumpVersion = ((bumpType: versionBump) => {
	const [major, minor, patch] = currentVersion.split(".").map(Number);
	switch (bumpType) {
		case versionBump.MAJOR:
			return `${major + 1}.0.0`;
		case versionBump.MINOR:
			return `${major}.${minor + 1}.0`;
		default:
			return `${major}.${minor}.${patch + 1}`;
	}
})(bumpType);

interface IProcess {
	execute: (version: string) => { code: number; },
	rollback: (version: string) => void,
	errMsg: string,
	executeMsg: string;
}

class ProcessStack {

	private version: string;
	private processArray: ReadonlyArray<IProcess>;

	constructor(processArray: ReadonlyArray<IProcess>, version: string) {
		this.version = version;
		this.processArray = processArray;
	}

	public async execute() {
		for (let i = 0; i < this.processArray.length; i++) {
			const process = this.processArray[i];
			console.log(process.executeMsg);
			try {
				const result = await process.execute(this.version);
				if (result && result.code !== 0) {
					console.warn(process.errMsg);
					return process.rollback(this.version);
				}
			}
			catch (err) {
				console.log(err);
				console.warn(process.errMsg);
				return process.rollback(this.version);
			}
			if (i === this.processArray.length - 1) {
				console.log('\x1b[32m', `Hoorah!! You published a new json-ts ${bumpType} version - ${this.version}`);
			}
		}
	}
}

const processArray: ReadonlyArray<IProcess> = [
	// Pull
	{
		execute: () => shell.exec("git pull -q"),
		rollback: () => null,
		errMsg: "Publish failed, could not pull changes json-ts. See logs for more details",
		executeMsg: "Pulling changes on json-ts..."
	},
	// Test
	{
		execute: () => shell.exec("npm run test"),
		rollback: () => null,
		errMsg: "Publish failed, could not pull changes json-ts. See logs for more details",
		executeMsg: "Running tests on json-ts..."
	},
	// Version (+git tag)
	{
		execute: (version: string) => shell.exec(`npm version ${version}`),
		rollback: (version: string) => shell.exec(`git tag -d v${version} && git reset --hard HEAD~1`),
		errMsg: "Publish failed, could not version json-ts. See logs for more details",
		executeMsg: "Running npm version on json-ts..."
	},
	// Push follow tags
	{
		execute: () => shell.exec("git push --follow-tags --no-verify"),
		rollback: (version: string) => shell.exec(`git tag -d v${version} && git reset --hard HEAD~1`),
		errMsg: "Publish failed, See logs for more details",
		executeMsg: "Git push..."
	}
];

const processStack = new ProcessStack(processArray, bumpVersion);
processStack.execute();
