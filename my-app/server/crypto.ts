import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type Envelope = {
  seed: string;
  payload: string;
  map: Record<string, string>;
  noise: Record<string, string>;
};

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function randomToken(size = 10): string {
  return randomBytes(size).toString("hex");
}

function createNoise(seed: string) {
  return {
    [randomToken(4)]: toBase64Url(seed.slice(0, 8)),
    [randomToken(4)]: toBase64Url(randomToken(6)),
    [randomToken(4)]: toBase64Url(`${Date.now()}`),
  };
}

function obfuscateObject(value: Record<string, unknown>) {
  const map: Record<string, string> = {};
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    const alias = randomToken(6);
    map[alias] = key;
    output[alias] = entry;
  }

  return { map, output };
}

function restoreObject(value: Record<string, unknown>, map: Record<string, string>) {
  const output: Record<string, unknown> = {};

  for (const [alias, entry] of Object.entries(value)) {
    const key = map[alias];
    if (key) {
      output[key] = entry;
    }
  }

  return output;
}

export function encryptPayload(payload: Record<string, unknown>, secret: string): Envelope {
  const seed = randomToken(8);
  const { map, output } = obfuscateObject(payload);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", deriveKey(secret), iv);
  const encoded = JSON.stringify(output);
  const encrypted = Buffer.concat([cipher.update(encoded, "utf8"), cipher.final()]);

  return {
    seed,
    payload: `${iv.toString("hex")}.${encrypted.toString("base64url")}`,
    map,
    noise: createNoise(seed),
  };
}

export function decryptPayload(input: Envelope, secret: string) {
  const [ivHex, value] = input.payload.split(".");
  const decipher = createDecipheriv("aes-256-cbc", deriveKey(secret), Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(value, "base64url")), decipher.final()]).toString("utf8");
  const parsed = JSON.parse(decrypted) as Record<string, unknown>;
  return restoreObject(parsed, input.map);
}

export function hashValue(value: string, secret: string) {
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function encodeResponseMeta(meta: Record<string, string>) {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [randomToken(5), toBase64Url(`${key}:${value}`)]));
}

export function decodeResponseMeta(meta: Record<string, string>) {
  const output: Record<string, string> = {};

  for (const value of Object.values(meta)) {
    const decoded = fromBase64Url(value);
    const [key, entry] = decoded.split(":");
    output[key] = entry;
  }

  return output;
}
