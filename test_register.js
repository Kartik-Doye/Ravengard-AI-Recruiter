async function run() {
  console.log("Running registration fetch...");
  try {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer UUID-1234" },
      body: JSON.stringify({ email: "test3@test.com", name: "Test3", mobile: "123", college: "Test", degree: "Test", gradYear: 2025, preferredLanguage: "English" })
    });
    console.log("Status:", res.status);
    console.log("Data:", await res.json());
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
