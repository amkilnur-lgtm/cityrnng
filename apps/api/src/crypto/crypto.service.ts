import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.schema";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const VERSION = "v1";

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService<Env, true>) {
    const keyB64: string = config.get("TOKEN_ENCRYPTION_KEY", { infer: true });
    this.key = Buffer.from(keyB64, "base64");
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
  }

  decrypt(payload: string): string {
    const [version, ivB64, tagB64, ctB64] = payload.split(":");
    if (version !== VERSION) {
      throw new Error(`Unsupported ciphertext version: ${version}`);
    }
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
      throw new Error("Invalid ciphertext envelope");
    }
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  }
}
