import { createHash } from "node:crypto";

export function sha1(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export function articleId(url: string): string {
  return sha1(url.trim().toLowerCase()).slice(0, 16);
}
