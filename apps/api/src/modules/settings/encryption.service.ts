import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class EncryptionService {
  private algorithm = "aes-256-cbc";
  private key: Buffer;

  constructor() {
    const secret =
      process.env.ENCRYPTION_KEY || "atlas-shop-dev-encryption-key-32chars!!";
    this.key = crypto.scryptSync(secret, "atlas-salt", 32);
  }

  encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
    try {
      const parts = encryptedText.split(":");
      const iv = Buffer.from(parts.shift()!, "hex");
      const encrypted = parts.join(":");
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      return encryptedText;
    }
  }
}
