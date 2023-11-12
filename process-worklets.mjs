import { readdir, readFile, writeFile } from "fs/promises";
import { transform } from "esbuild";

for (const file of await readdir("dist/worklets")) {
	if (!file.endsWith(".js")) continue;

	const fullPath = `dist/worklets/${file}`;
	const workletContent = (await readFile(fullPath)).toString();

	const min = await transform(workletContent, {
		minify: true,
		mangleProps: /^__/g,
	});

	const wrappedContent =
		"export default URL.createObjectURL(new Blob(`" +
		min.code.replaceAll("`", "\\`").trim() +
		'`,{type:"text/javascript"}))';

	await writeFile(fullPath, wrappedContent);
}
