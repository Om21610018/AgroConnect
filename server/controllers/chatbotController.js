const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data"); // Import the form-data library
require("dotenv").config(); // Load environment variables from .env file

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `recording_${Date.now()}.wav`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "audio/wav" || file.originalname.endsWith(".wav")) {
      cb(null, true);
    } else {
      cb(new Error("Only WAV audio files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

exports.chatbotController = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No audio file uploaded or invalid format" });
      }

      const audioFilePath = req.file.path;
      console.log(`WAV audio file saved at: ${audioFilePath}`);

      const formData = new FormData();
      const fileStream = fs.createReadStream(audioFilePath);
      formData.append("file", fileStream, req.file.filename);

      console.log("Sending WAV file to transcription service:", req.file.filename);

      try {
        // Send the file to the transcription service
        const transcriptionResponse = await axios.post(
          "http://localhost:5000/transcribe",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );

        console.log(
          "📝 Transcription:",
          transcriptionResponse.data.transcription || transcriptionResponse.data.error
        );

        const inputValue = transcriptionResponse?.data?.transcription;

        if (!inputValue) {
          throw new Error("No transcription returned from the transcription service.");
        }

        console.log("Sending transcription to external API:", inputValue);

        // Send the transcription to the external API
        const apiResponse = await fetch(
          "http://34.93.113.136:7860/api/v1/run/d12b3797-1a66-4681-98fc-d5c0cb1a70c9?stream=false",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "sk-RWBBBynk62ICCt7iqRwq7tEFJO96wTE7Tfg2m-nrpJU",
            },
            body: JSON.stringify({
              input_value: inputValue,
              output_type: "chat",
              input_type: "chat",
              tweaks: {},
            }),
          }
        );

        const apiResponseData = await apiResponse.json();

        // Debugging: Log the full response from the external API
        console.log("Full API Response:", JSON.stringify(apiResponseData, null, 2));

        // Extract the text from the response
        const responseText =
        apiResponseData?.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
        apiResponseData?.outputs?.[0]?.outputs?.message?.text ||
        apiResponseData?.outputs?.[0]?.outputs?.results?.message?.data?.text ||
        "No text found in the API response."; 

        console.log("Extracted Text:", responseText);

        if (!responseText) {
          throw new Error("No valid text found in the API response.");
        }

        // Send the responseText to the Marathi-to-speech API
        try {
          const marathiSpeechResponse = await axios.post(
            "http://localhost:6000/marathi-to-speech",
            { text: responseText },
            {
              headers: {
          "Content-Type": "application/json",
              },
            }
          );
          console.log("Marathi-to-speech API response:", marathiSpeechResponse.data);
          const audioFilePathResponse = marathiSpeechResponse?.data?.file_path
        
          if (!audioFilePathResponse) {
            throw new Error("No audio file path returned from Marathi-to-speech API.");
          }

          console.log("Audio file path from Marathi-to-speech API:", audioFilePathResponse);

          // Respond with the extracted text and audio file path
          res.json({
            filePath: audioFilePath,
            translatedText: responseText || "No transcription returned",
            externalApiResponse: responseText,
            marathiAudioFilePath: audioFilePathResponse,
          });
        } catch (marathiSpeechError) {
          console.error("Error calling Marathi-to-speech API:", marathiSpeechError.message);
          res.status(500).json({
            error: "Failed to get Marathi audio file",
            details: marathiSpeechError.message,
          });
        }
      } catch (transcriptionError) {
        console.error("Error calling transcription service:", transcriptionError.message);
        res.status(500).json({
          error: "Failed to get transcription",
          details: transcriptionError.message,
        });
      }

      // Delete the uploaded file after processing
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error("Error deleting file:", err);
        else console.log(`File ${audioFilePath} deleted successfully`);
      });
    } catch (error) {
      console.error("Error processing audio file:", error);
      res.status(500).json({ error: error.message || "Failed to process audio file" });
    }
  },
];