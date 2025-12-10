const express = require("express");
const app = express();

const https = require("https");

const port = process.env.PORT || 8080;

// 💡 Essential Middleware: This tells Express to parse incoming requests
// with JSON payloads and makes the data available in req.body.
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server running");
});

app.post("/send-email", (req, expressRes) => {
  const { subject, content, html_content, from } = req.body;

  // 2. Perform basic validation
  if (!subject || !content || !from) {
    return expressRes.status(400).json({
      error:
        "Missing required fields: 'subject' and 'content' are required in the request body.",
    });
  }

  // Hardcoded credentials and general setup (ideally use process.env)
  const consumerKey = "7d3e23be52c8226b6654";
  const consumerSecret = "OiXT3yenAoK41WDqRdfE";

  // 3. Setup body using the extracted payload data
  const sendData = {
    from: from, //user email
    to: "contact@mansonprimehusky.com",
    subject: subject, // Dynamically set
    content: content, // Dynamically set (plain text)
    // Optional: Use html_content from the payload, or generate a simple HTML version
    html_content: html_content || `<p>${content.replace(/\n/g, "<br>")}</p>`,
  };

  // setup request options (remaining code is the same as the fix)
  const options = {
    hostname: "api.turbo-smtp.com",
    path: "/api/v2/mail/send",
    method: "POST",
    headers: {
      Accept: "application/json",
      Consumerkey: consumerKey,
      Consumersecret: consumerSecret,
      "Content-Type": "application/json",
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    let responseData = "";
    apiRes.on("data", (chunk) => {
      responseData += chunk;
    });

    apiRes.on("end", () => {
      try {
        const result = JSON.parse(responseData);
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
          expressRes.status(apiRes.statusCode).json(result);
        } else {
          console.error("External API Error:", result);
          expressRes.status(apiRes.statusCode || 500).json({
            error: "Email service failed.",
            details: result,
          });
        }
      } catch (e) {
        console.error("Failed to parse API response:", e);
        expressRes.status(500).json({
          error: "Internal server error while processing API response.",
        });
      }
    });
  });

  apiReq.on("error", (error) => {
    console.error("HTTP Request Error:", error.message);
    expressRes.status(500).json({
      error: "Failed to connect to the external email service.",
      details: error.message,
    });
  });

  apiReq.write(JSON.stringify(sendData));
  apiReq.end();
});
app.listen(port, () => {
  `Server started on port ${port}`;
});
