import { $ } from "bun";

async function git(...args: string[]): Promise<string> {
	return (await $`git ${args}`.quiet().nothrow().text()).trim();
}

const version = (await git("describe", "--tags", "--abbrev=0")) || "develop";
const commit = await git("rev-parse", "--short", "HEAD");
const time = `${new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" })} KST`;

await $`rm -rf dist`;

// bun 은 CSS url() 자산을 항상 base64 로 인라인한다 (loader 옵션 무시).
// 폰트까지 인라인되면 CSS 가 ~500KB(gzip) 로 커지고 unicode-range 지연 로드가
// 깨지므로, 폰트 url 은 그대로 두고 파일만 dist 로 복사한다.
const fonts: Promise<number>[] = [];

const out = await Bun.build({
	entrypoints: ["./index.html"],
	outdir: "dist",
	minify: true,
	plugins: [
		{
			name: "font-files",
			setup(build) {
				build.onResolve({ filter: /\.woff2?$/ }, ({ path, importer }) => {
					const src = new URL(path, Bun.pathToFileURL(importer));
					fonts.push(Bun.write(`dist/${path}`, Bun.file(src)));
					return { path, external: true };
				});
			},
		},
	],
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
		__APP_VERSION__: JSON.stringify(version),
		__APP_COMMIT__: JSON.stringify(commit),
		__APP_BUILD_TIME__: JSON.stringify(time),
	},
});

if (!out.success) {
	console.error(out.logs);
	process.exit(1);
}
await Promise.all(fonts);
