import { test } from "node:test";
import assert from "node:assert/strict";
import { binaryToBuffer, isSafeFilename, isUploadFolder, MAX_UPLOAD_BYTES, parseUploadUrl, sniffImage, validateImage } from "../lib/upload-core";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const gif = Buffer.from("GIF89a....");
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const exe = Buffer.from("MZ\x90\x00");

test("detects image types from magic bytes", () => {
  assert.equal(sniffImage(png)?.mime, "image/png");
  assert.equal(sniffImage(jpg)?.mime, "image/jpeg");
  assert.equal(sniffImage(gif)?.mime, "image/gif");
  assert.equal(sniffImage(webp)?.mime, "image/webp");
  assert.equal(sniffImage(svg), null);
  assert.equal(sniffImage(exe), null);
});

test("rejects svg, executables, empty and oversize files", () => {
  assert.equal(validateImage(svg, "a.svg", "image/svg+xml").ok, false);
  assert.equal(validateImage(exe, "a.png", "image/png").ok, false);
  assert.equal(validateImage(Buffer.alloc(0), "a.png", "image/png").ok, false);
  const big = Buffer.concat([png, Buffer.alloc(MAX_UPLOAD_BYTES)]);
  const r = validateImage(big, "a.png", "image/png");
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 413);
});

test("rejects MIME / extension mismatches and accepts consistent files", () => {
  assert.equal(validateImage(png, "photo.jpg", "image/png").ok, false);
  assert.equal(validateImage(png, "photo.png", "image/jpeg").ok, false);
  assert.equal(validateImage(png, "photo.png", "image/png").ok, true);
  assert.equal(validateImage(jpg, "photo.jpeg", "image/jpeg").ok, true);
});

test("folder whitelist and filename safety", () => {
  assert.ok(isUploadFolder("pages"));
  assert.ok(!isUploadFolder("../etc"));
  assert.ok(!isUploadFolder("private"));
  assert.ok(isSafeFilename("1760000000000-0123456789abcdef0123456789abcdef.png"));
  for (const bad of ["../x.png", "a/b.png", "a\\b.png", "x\u0000.png", "evil.svg", "1760000000000-zz.png", "..png"]) assert.ok(!isSafeFilename(bad), bad);
});

test("parses only our upload URLs", () => {
  assert.deepEqual(parseUploadUrl("/api/uploads/pages/1760000000000-0123456789abcdef.webp"), { folder: "pages", filename: "1760000000000-0123456789abcdef.webp" });
  assert.equal(parseUploadUrl("/uploads/pages/1760000000000-0123456789abcdef.webp"), null); // legacy
  assert.equal(parseUploadUrl("/api/uploads/pages/../../x"), null);
  assert.equal(parseUploadUrl("/api/uploads/secret/1760000000000-0123456789abcdef.png"), null);
  assert.equal(parseUploadUrl("https://evil.com/api/uploads/pages/1760000000000-0123456789abcdef.png"), null);
  assert.equal(parseUploadUrl(""), null);
});

test("normalises BSON binary to Buffer", () => {
  assert.deepEqual(binaryToBuffer({ buffer: new Uint8Array([1, 2]) }), Buffer.from([1, 2]));
  assert.deepEqual(binaryToBuffer(Buffer.from([3])), Buffer.from([3]));
  assert.equal(binaryToBuffer(null).length, 0);
});
