require('dotenv').config();
const crypto = require('node:crypto');
const pg = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { users } = require('./src/db/schema.ts'); 
const { eq } = require('drizzle-orm');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${dk.toString("hex")}`;
}

async function main() {
  const email = "foryou031@gmail.com";
  const rawPassword = "09870987#@";
  const passwordHash = hashPassword(rawPassword);

  console.log("⏳ အကောင့် ဖန်တီးနေပါတယ်...");

  try {
    // အရင်ရှိပြီးသားဆိုရင် ဖျက်ပါ (သို့) update လုပ်ပါ
    await db.delete(users).where(eq(users.email, email));

    await db.insert(users).values({
      email: email,
      passwordHash: passwordHash,
      emailVerified: true,
      displayName: "Pro Tester",
      isPro: true,
      proExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ရက် ၃၀
      credits: 500,
    });

    console.log("✅ အောင်မြင်ပါတယ်!");
    console.log("========================");
    console.log("📧 Email: " + email);
    console.log("🔑 Password: " + rawPassword);
    console.log("💎 Status: PRO (30 Days)");
    console.log("💰 Credits: 500");
    console.log("========================");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
