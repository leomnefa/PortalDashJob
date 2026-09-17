import { readFile } from "node:fs/promises";
import { ProfileSchema } from "./types.js";
import type { Profile } from "./types.js";

export async function loadProfileFromFile(filePath: string): Promise<Profile> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `No encontré ${filePath}. Copiá data/profile.example.json a data/profile.json y completá tus datos.`,
      );
    }
    throw err;
  }
  return ProfileSchema.parse(JSON.parse(raw));
}
