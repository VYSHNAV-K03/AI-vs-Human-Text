const pdfParse = require("pdf-parse");
const multer = require("multer");
const express = require("express");
const upload = require("../config/multerConfig");
const router = express.Router();
const HUGGINGFACE_API_KEY = "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"; // Use environment variable
const fs = require("fs");
const axios = require("axios");

function softmax([x, y]) {
  const ex = Math.exp(x);
  const ey = Math.exp(y);
  const sum = ex + ey;
  return [ex / sum, ey / sum];
}

router.post("/analyze-text", async (req, res) => {
  const { text } = req.body;
  const apiURL =
    "https://api-inference.huggingface.co/models/Hello-SimpleAI/roberta-base-openai-detector";

  try {
    const response = await axios.post(
      apiURL,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          Accept: "application/json",
        },
        timeout: 20000,
      }
    );

    const logits = response.data[0].logits;
    const [humanScore, aiScore] = softmax(logits);

    const label = aiScore > humanScore ? "AI-generated" : "Human-written";
    console.log(`Prediction: ${label}`);
    console.log(
      `Confidence: AI: ${(aiScore * 100).toFixed(2)}%, Human: ${(
        humanScore * 100
      ).toFixed(2)}%`
    );
  } catch (err) {
    console.error("Error analyzing text:", err.response?.data || err.message);
  }
});

router.post("/analyze-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "PDF file is required" });

  const dataBuffer = fs.readFileSync(req.file.path);

  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text;
  try {
    if (!text) return res.status(400).json({ error: "Text is required" });

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/openai-community/roberta-large-openai-detector",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data[0]; // Get the first prediction set
    const label0 = result.find((r) => r.label === "LABEL_0"); // AI-generated
    const label1 = result.find((r) => r.label === "LABEL_1"); // Human-written

    console.log("AI Generated:", label0.score, "Human Written:", label1.score);

    const prediction =
      label0.score > label1.score && label0.score > 0.7
        ? {
            label: "AI Generated",
            confidence: (label0.score * 100).toFixed(2) + "%",
          }
        : {
            label: "Human Written",
            confidence: (label1.score * 100).toFixed(2) + "%",
          };

    console.log("Prediction:", prediction);
    res.json({ prediction });
  } catch (error) {
    console.error(
      "Error analyzing text:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Error analyzing text",
      details: error.response?.data || error.message,
    });
  }
});

// Sentiment analysis for emotion detection
router.post("/detect-emotion/text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      { inputs: text },
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
      }
    );

    console.log("Emotion API Response:", response.data);
    const emotions =
      response.data.length > 0
        ? response.data[0][0].label
        : "No emotion detected";
    res.json({ emotion: emotions, full_response: response.data });
  } catch (error) {
    console.error(
      "Error detecting emotion:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Error detecting emotion", details: error.message });
  }
});

router.post("/detect-emotion", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "PDF file is required" });

    const dataBuffer = fs.readFileSync(req.file.path);

    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    if (!text)
      return res.status(400).json({ error: "No text extracted from PDF" });

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      { inputs: text },
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const emotions =
      response.data.length > 0
        ? response.data[0][0].label
        : "No emotion detected";

    res.json({ emotion: emotions, full_response: response.data, text });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path); // Clean up file on error
    console.error(
      "Error detecting emotion:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Error detecting emotion", details: error.message });
  }
});
function splitTextIntoChunks(text, maxLength = 500) {
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  let chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}

router.post("/translate-text", async (req, res) => {
  try {
    const { text, languages } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ error: "Languages array is required" });
    }

    let translations = {};

    for (let lang of languages) {
      const chunks = splitTextIntoChunks(text);
      let translatedChunks = [];

      for (let chunk of chunks) {
        const response = await axios.get(
          `https://translate.googleapis.com/translate_a/single`,
          {
            params: {
              client: "gtx",
              sl: "auto",
              tl: lang,
              dt: "t",
              q: chunk,
            },
          }
        );

        // Join all translated parts
        const translatedText = response.data[0]
          .map((item) => item[0])
          .join(" ");
        translatedChunks.push(translatedText);
      }

      translations[lang] = translatedChunks.join(" ");
    }

    res.json({ translations });
  } catch (error) {
    console.error("Error translating text:", error.message);
    res.status(500).json({ error: "Error translating text" });
  }
});

router.post("/translate-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const { languages } = req.body;
    if (
      !languages ||
      !Array.isArray(JSON.parse(languages)) ||
      JSON.parse(languages).length === 0
    ) {
      return res.status(400).json({ error: "Languages array is required" });
    }

    if (!req.file)
      return res.status(400).json({ error: "PDF file is required" });

    // Read and extract text from PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    if (!text)
      return res.status(400).json({ error: "No text extracted from PDF" });

    let translations = {};
    const langs = JSON.parse(languages); // parse the stringified array

    for (let lang of langs) {
      const response = await axios.get(
        `https://translate.googleapis.com/translate_a/single`,
        {
          params: {
            client: "gtx",
            sl: "auto",
            tl: lang,
            dt: "t",
            q: text,
          },
        }
      );
      translations[lang] = response.data[0]
        .map((segment) => segment[0])
        .join(""); // supports multiple chunks
    }

    fs.unlinkSync(req.file.path); // Clean up

    res.json({ translations });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path); // Clean up on error
    console.error("Error translating text:", error.message);
    res
      .status(500)
      .json({ error: "Error translating text", details: error.message });
  }
});

module.exports = router;
