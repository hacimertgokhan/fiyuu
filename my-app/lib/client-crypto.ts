type Envelope = {
  seed: string;
  payload: string;
  map: Record<string, string>;
  noise: Record<string, string>;
};

function randomToken(size = 12) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(input: string) {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
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

async function importAesKey(secret: string) {
  const secretBytes = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", digest, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
}

export async function obfuscateRequest(payload: Record<string, unknown>, secret: string): Promise<Envelope> {
  const seed = randomToken(8);
  const { map, output } = obfuscateObject(payload);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await importAesKey(secret);
  const encoded = new TextEncoder().encode(JSON.stringify(output));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, encoded);

  return {
    seed,
    payload: `${Array.from(iv, (value) => value.toString(16).padStart(2, "0")).join("")}.${toBase64Url(String.fromCharCode(...new Uint8Array(encrypted)))}`,
    map,
    noise: {
      [randomToken(4)]: toBase64Url(seed.slice(0, 8)),
      [randomToken(4)]: toBase64Url(randomToken(6)),
    },
  };
}

export async function readObfuscatedResponse(input: Envelope, secret: string) {
  const [ivHex, payload] = input.payload.split(".");
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((value) => parseInt(value, 16)) ?? []);
  const encrypted = Uint8Array.from(fromBase64Url(payload), (char) => char.charCodeAt(0));
  const key = await importAesKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
  const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, unknown>;
  return restoreObject(parsed, input.map);
}

export async function signRequestBody(body: string) {
  const bytes = new TextEncoder().encode(body);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}
