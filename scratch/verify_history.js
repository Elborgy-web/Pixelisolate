#!/usr/bin/env node
/**
 * Script to verify and diagnose history API functionality.
 * Run with: node scratch/verify_history.js
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://nyiwicwbwzjkijamqqsl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXdpY3did3pqa2lqYW1xcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDIwNTA4OCwiZXhwIjoyMDk5NzgxMDg4fQ.D7fD73CPmzJLyWq2cgTmXR89TnYdbMsKVvnmqXgPA4A"
);

// Test 1px JPEG buffer
const onePixelJpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDB" +
  "kSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAR" +
  "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA" +
  "AAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAA" +
  "AAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=",
  "base64"
);

async function verifyAll() {
  console.log("\n=== Supabase History Verification ===\n");

  // 1. Check bucket existence
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  const historyBucket = buckets?.find((b) => b.name === "history_images");
  console.log(`[1] history_images bucket: ${historyBucket ? "✅ EXISTS" : "❌ MISSING"}`);
  if (bucketErr) console.log("    Error:", bucketErr.message);

  // 2. Check history table
  const { data: rows, error: tableErr } = await supabase
    .from("history")
    .select("id, user_id, created_at")
    .limit(3)
    .order("created_at", { ascending: false });
  console.log(`[2] history table: ${tableErr ? "❌ ERROR: " + tableErr.message : "✅ OK - " + rows?.length + " recent records"}`);
  if (rows?.length) console.log("    Latest entries:", rows.map(r => `${r.id} (${r.user_id?.substring(0,8)}...)`).join(", "));

  // 3. Test storage upload
  const testPath = `test-user/${Date.now()}-verify.jpg`;
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from("history_images")
    .upload(testPath, onePixelJpeg, { contentType: "image/jpeg", upsert: true });
  console.log(`[3] Storage upload: ${uploadErr ? "❌ ERROR: " + uploadErr.message : "✅ SUCCESS - " + uploadData?.path}`);

  // 4. Test via backend API
  console.log("\n[4] Testing backend API endpoint...");
  try {
    const response = await fetch("https://pixelisolate-backend.onrender.com/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        originalBase64: "data:image/jpeg;base64," + onePixelJpeg.toString("base64"),
        processedBase64: "data:image/jpeg;base64," + onePixelJpeg.toString("base64"),
      }),
    });
    const data = await response.json();
    console.log(`    Status: ${response.status}`);
    console.log(`    Response: ${JSON.stringify(data).substring(0, 200)}`);
    console.log(`    Result: ${response.ok ? "✅ HISTORY SAVE WORKING!" : "❌ FAILED"}`);
  } catch (err) {
    console.log(`    ❌ Network error: ${err.message}`);
  }

  console.log("\n=== Done ===\n");
}

verifyAll();
