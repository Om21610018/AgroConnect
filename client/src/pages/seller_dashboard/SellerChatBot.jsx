import React, { useState, useRef } from "react";
import axios from "axios";
import { AudioRecorder } from "react-audio-voice-recorder";
import { FaPlay, FaPause, FaRedo } from "react-icons/fa";

const SellerChatBot = () => {
  const [responseText, setResponseText] = useState("");
  const [marathiText, setMarathiText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordedAudio, setRecordedAudio] = useState(null);

  // Speech synthesis states
  const [isHindiSpeaking, setIsHindiSpeaking] = useState(false);
  const [isMarathiSpeaking, setIsMarathiSpeaking] = useState(false);
  const [isHindiPaused, setIsHindiPaused] = useState(false);
  const [isMarathiPaused, setIsMarathiPaused] = useState(false);

  // Refs for speech synthesis
  const synthRef = useRef(window.speechSynthesis);
  const hindiUtteranceRef = useRef(null);
  const marathiUtteranceRef = useRef(null);

  const handleRecordingComplete = async (blob) => {
    try {
      const wavBlob = await convertToWav(blob);
      const audioFile = new File([wavBlob], "recording.wav", {
        type: "audio/wav",
      });

      setRecordedAudio({
        file: audioFile,
        blob: wavBlob,
        url: URL.createObjectURL(wavBlob),
      });

      setError("");
    } catch (error) {
      console.error("Error processing recording:", error);
      setError("Failed to process recording. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!recordedAudio) {
      setError("Please record audio before submitting.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", recordedAudio.file);

      const response = await axios.post(
        "http://localhost:8000/chatbot/ask",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Set translated text (Hindi)
      setResponseText(response.data.translatedText);

      // Set Marathi text if available in the response
      if (response.data.marathiText) {
        setMarathiText(response.data.marathiText);
      }

      // Speak Hindi response
      speakHindiResponse(response.data.translatedText);
    } catch (error) {
      console.error("Error sending audio to backend:", error);
      setError("Failed to process audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const convertToWav = async (blob) => {
    if (blob.type === "audio/wav") return blob;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const arrayBuffer = reader.result;
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavBuffer = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length * numChannels * 2;
    const sampleRate = buffer.sampleRate;
    const view = new DataView(new ArrayBuffer(44 + length));

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, length, true);

    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const s = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, s, true);
        offset += 2;
      }
    }

    return view.buffer;
  };

  const writeString = (dataView, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      dataView.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Speech synthesis for Hindi response
  const speakHindiResponse = (text) => {
    if (!text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();
 

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    utterance.onstart = () => {
      setIsHindiSpeaking(true);
      setIsHindiPaused(false);
      // Stop Marathi speech if it's playing
      setIsMarathiSpeaking(false);
      setIsMarathiPaused(false);
    };

    utterance.onend = () => {
      setIsHindiSpeaking(false);
      setIsHindiPaused(false);
    };

    hindiUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Speech synthesis for Marathi response
  const speakMarathiResponse = (text) => {
    if (!text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "mr-IN"; // Marathi language code
    utterance.rate = 1;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => {
      setIsMarathiSpeaking(true);
      setIsMarathiPaused(false);
      // Stop Hindi speech if it's playing
      setIsHindiSpeaking(false);
      setIsHindiPaused(false);
    };

    utterance.onend = () => {
      setIsMarathiSpeaking(false);
      setIsMarathiPaused(false);
    };

    marathiUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Toggle speech for Hindi
  const toggleHindiSpeech = () => {
    if (!hindiUtteranceRef.current) {
      // If no utterance yet, create and start speaking
      speakHindiResponse(responseText);
      return;
    }

    if (
      synthRef.current.speaking &&
      !synthRef.current.paused &&
      isHindiSpeaking
    ) {
      synthRef.current.pause();
      setIsHindiPaused(true);
      setIsHindiSpeaking(false);
    } else if (synthRef.current.paused && isHindiPaused) {
      synthRef.current.resume();
      setIsHindiPaused(false);
      setIsHindiSpeaking(true);
    }
  };

  // Toggle speech for Marathi
  const toggleMarathiSpeech = () => {
    if (!marathiUtteranceRef.current) {
      // If no utterance yet, create and start speaking
      speakMarathiResponse(marathiText);
      return;
    }

    if (
      synthRef.current.speaking &&
      !synthRef.current.paused &&
      isMarathiSpeaking
    ) {
      synthRef.current.pause();
      setIsMarathiPaused(true);
      setIsMarathiSpeaking(false);
    } else if (synthRef.current.paused && isMarathiPaused) {
      synthRef.current.resume();
      setIsMarathiPaused(false);
      setIsMarathiSpeaking(true);
    }
  };

  // Restart Hindi speech
  const restartHindiSpeech = () => {
    if (responseText) {
      synthRef.current.cancel();
      speakHindiResponse(responseText);
    }
  };

  // Restart Marathi speech
  const restartMarathiSpeech = () => {
    if (marathiText) {
      synthRef.current.cancel();
      speakMarathiResponse(marathiText);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Seller ChatBot - Voice Input</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Record your message</h2>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            audioTrackConstraints={{
              noiseSuppression: true,
              echoCancellation: true,
            }}
            downloadOnSavePress={false}
            downloadFileExtension="wav"
          />
        </div>

        {recordedAudio && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Your recording</h2>
            <audio src={recordedAudio.url} controls className="w-full mb-4" />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:bg-gray-400 w-full"
            >
              {isLoading ? "Processing..." : "Submit Recording"}
            </button>
          </div>
        )}

        {error && <div className="mt-4 text-red-500 mb-6">{error}</div>}

        {responseText && !isLoading && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold mb-2">Hindi Response:</h2>
            <div className="whitespace-pre-line mb-3">{responseText}</div>
            <div className="flex gap-4">
              <button
                onClick={restartHindiSpeech}
                className="text-blue-500 hover:text-blue-700"
              >
                <FaRedo size={22} title="Play from start" />
              </button>
              <button
                onClick={toggleHindiSpeech}
                className="text-blue-500 hover:text-blue-700"
              >
                {isHindiPaused ? (
                  <FaPlay size={22} title="Resume" />
                ) : isHindiSpeaking ? (
                  <FaPause size={22} title="Pause" />
                ) : (
                  <FaPlay size={22} title="Play" />
                )}
              </button>
            </div>
          </div>
        )}

        {marathiText && !isLoading && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold mb-2">Marathi Response:</h2>
            <div className="whitespace-pre-line mb-3">{marathiText}</div>
            <div className="flex gap-4">
              <button
                onClick={restartMarathiSpeech}
                className="text-blue-500 hover:text-blue-700"
              >
                <FaRedo size={22} title="Play from start" />
              </button>
              <button
                onClick={toggleMarathiSpeech}
                className="text-blue-500 hover:text-blue-700"
              >
                {isMarathiPaused ? (
                  <FaPlay size={22} title="Resume" />
                ) : isMarathiSpeaking ? (
                  <FaPause size={22} title="Pause" />
                ) : (
                  <FaPlay size={22} title="Play" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerChatBot;
