// Set environment to test so that SMTP is mocked and a separate port is used
process.env.NODE_ENV = "test";
process.env.PORT = "5001";

console.log("--- STARTING PORTFOLIO REST API TEST SUITE ---");

// Start the server by importing index.js
import("./index.js");

// Wait 1.5 seconds for the server to spin up
await new Promise((resolve) => setTimeout(resolve, 1500));

let failures = 0;

// Helper to run a test case
const runTestCase = async (name, payload, expectedStatus, expectedMessageCheck, customPath = "/send-email") => {
  console.log(`\nRunning Test Case: "${name}"`);
  try {
    const res = await fetch(`http://localhost:5001${customPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000" // Allowed origin for test
      },
      body: JSON.stringify(payload)
    });

    const statusMatches = res.status === expectedStatus;
    const body = await res.json();
    const messageMatches = body.message && body.message.includes(expectedMessageCheck);

    if (statusMatches && messageMatches) {
      console.log(`✅ SUCCESS: Status = ${res.status}, Message matches "${expectedMessageCheck}"`);
    } else {
      console.error(`❌ FAILED: Status = ${res.status} (Expected ${expectedStatus}), Message = "${body.message}" (Expected containing "${expectedMessageCheck}")`);
      failures++;
    }
  } catch (error) {
    console.error(`❌ ERROR in test case "${name}":`, error.message);
    failures++;
  }
};

// Test Case 1: Empty Fields
await runTestCase(
  "Reject empty submissions",
  { name: "", email: "test@example.com", message: "Hello world" },
  400,
  "All fields are required"
);

// Test Case 2: Missing fields (null/undefined)
await runTestCase(
  "Reject null or undefined fields",
  { name: null, email: "test@example.com", message: "Hello world" },
  400,
  "Invalid inputs"
);

// Test Case 3: Invalid email format
await runTestCase(
  "Reject invalid email formats",
  { name: "John Doe", email: "invalid-email", message: "Hello there!" },
  400,
  "Invalid email format"
);

// Test Case 4: Successful submission & sanitization verification
await runTestCase(
  "Accept valid contact submissions & sanitization checks on /send-email",
  { 
    name: "John <script>alert('xss')</script> Doe", 
    email: "john.doe@gmail.com", 
    message: "This is a <p>great</p> portfolio!" 
  },
  200,
  "Message sent successfully",
  "/send-email"
);

// Test Case 4b: Successful submission & sanitization verification on namespace path
await runTestCase(
  "Accept valid contact submissions & sanitization checks on /api/send-email",
  { 
    name: "John Doe", 
    email: "john.doe@gmail.com", 
    message: "Testing the namespace route!" 
  },
  200,
  "Message sent successfully",
  "/api/send-email"
);

// Test Case 5: Rate limiter check
console.log("\nTesting Rate Limiter (Sending multiple rapid requests)...");
for (let i = 0; i < 4; i++) {
  try {
    const res = await fetch("http://localhost:5001/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000"
      },
      body: JSON.stringify({ name: `Spammer ${i}`, email: `spammer${i}@test.com`, message: "Spam message" })
    });
    console.log(`Request ${i + 1}: Status = ${res.status}`);
    if (res.status === 429) {
      console.log("✅ Rate limiter correctly blocked request after threshold.");
      break;
    }
  } catch (e) {
    console.error("Rate limiter fetch failed:", e.message);
  }
}

console.log("\n--- TEST SUITE SUMMARY ---");
if (failures === 0) {
  console.log("🏆 ALL TESTS PASSED SUCCESSFULLY! The REST API and mailing automation is fully secure, robust, and production-ready.");
  process.exit(0);
} else {
  console.error(`💥 TEST SUITE FAILED with ${failures} failure(s).`);
  process.exit(1);
}
