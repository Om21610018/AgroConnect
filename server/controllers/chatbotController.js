const { spawn } = require("child_process");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.CHATBOT_GEMINI_API_KEY);

function runPythonScript() {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(__dirname, "voice_to_text.py")]);
    let transcript = "";

    pythonProcess.stdout.setEncoding("utf8"); // Ensure UTF-8 encoding
    pythonProcess.stdout.on("data", (data) => {
      transcript += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(transcript.trim());
      } else {
        reject(`Python process exited with code ${code}`);
      }
    });
  });
}

function translateText(text, sourceLang, targetLang) {
  return new Promise((resolve, reject) => {
    const python = spawn(
      "python",
      ["./translate.py", text, sourceLang, targetLang],
      {
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      }
    );
    let translatedText = "";

    python.stdout.on("data", (data) => {
      translatedText += data.toString("utf-8");
    });

    python.stderr.on("data", (data) => {
      console.error(`Python Error: ${data}`);
      reject(data.toString("utf-8"));
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(`Python process exited with code ${code}`);
      } else {
        resolve(translatedText.trim());
      }
    });
  });
}

// Function to generate content using Google Gemini
async function generateGeminiContent(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([prompt]);
  return result.response.text();
}

exports.chatbotController = async (req, res) => {
  try {
    // Run Python script to capture Hindi speech and convert it to text
    const hindiText = await runPythonScript();

    // Hindi to English translation using Google Gemini
    const geminiResponse = await generateGeminiContent(hindiText);
    console.log("Gemini Response:", geminiResponse);
    // const hindiResponse = await translateText(geminiResponse, 'en', 'hi');
    res.json({ result: geminiResponse, hindiText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during processing" });
  }
};


