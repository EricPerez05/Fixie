import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

// PNG width and height sit at fixed offsets in the IHDR chunk.
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("web app manifest", () => {
  const result = manifest();

  it("opens Fixie full screen from the home screen", () => {
    expect(result).toMatchObject({ name: "Fixie", short_name: "Fixie", start_url: "/", display: "standalone" });
    expect(result.theme_color).toBe(result.background_color);
  });

  it("matches the start screen's green", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain(`--moss-deep: ${result.background_color};`);
  });

  it("lists a 192px, a 512px and a maskable icon", () => {
    const icons = result.icons ?? [];
    expect(icons.map(({ sizes, purpose }) => `${sizes} ${purpose}`)).toEqual([
      "192x192 any",
      "512x512 any",
      "512x512 maskable",
    ]);
  });

  it.each(manifest().icons ?? [])("ships $src at the size it claims", ({ src, sizes }) => {
    const { width, height } = pngSize(join(process.cwd(), "public", src));
    expect(`${width}x${height}`).toBe(sizes);
  });

  it("ships a 180px iPhone home-screen icon", () => {
    expect(pngSize(join(process.cwd(), "app/apple-icon.png"))).toEqual({ width: 180, height: 180 });
  });
});
