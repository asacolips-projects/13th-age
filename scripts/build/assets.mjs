import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { SYSTEM_IMAGES, SYSTEM_SVG } from "./constants.mjs";
import { ensureDir, globFiles, log, resolveFromRoot } from "./utils.mjs";

const ASSETS_SRC = resolveFromRoot("src/assets/src");
const ASSETS_DEST = resolveFromRoot("dist/assets");

/**
 * Convert PNG/JPEG source images in src/assets/src to WebP in dist/assets.
 * @returns {Promise<void>}
 */
export async function compileImages() {
	const files = await globFiles(SYSTEM_IMAGES);

	for (const file of files) {
		const relativePath = path.relative(ASSETS_SRC, file);
		const outFile = path.join(
			ASSETS_DEST,
			relativePath.replace(/\.(png|jpe?g)$/i, ".webp")
		);
		ensureDir(path.dirname(outFile));

		await sharp(file).webp()
			.toFile(outFile);
	}

	log("images", `converted ${files.length} files`);
}

/**
 * Copy SVG source images from src/assets/src to dist/assets.
 * @returns {Promise<void>}
 */
export async function compileSvg() {
	const files = await globFiles(SYSTEM_SVG);

	for (const file of files) {
		const relativePath = path.relative(ASSETS_SRC, file);
		const outFile = path.join(ASSETS_DEST, relativePath);
		ensureDir(path.dirname(outFile));
		fs.copyFileSync(file, outFile);
	}

	log("svg", `copied ${files.length} files`);
}

/**
 * Process all source images (raster to WebP, SVG copy).
 * @returns {Promise<void>}
 */
export async function compileAssets() {
	await Promise.all([compileImages(), compileSvg()]);
}
