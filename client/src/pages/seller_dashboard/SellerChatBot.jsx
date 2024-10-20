import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MicrophoneIcon,
  StopIcon,
  SpeakerWaveIcon,
  PauseIcon,
  PlayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

export default function SellerChatBot() {
  const [geminiResponse, setGeminiResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const [hindiText, setHindiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState(null);
  const utteranceRef = useRef(null);
  const synth = window.speechSynthesis;

  useEffect(() => {
    return () => {
      synth.cancel();
    };
  }, []);

  const startRecording = async () => {
    setRecording(true);
    setLoading(true);
    setGeminiResponse("");
    setHindiText("");
    setError(null);

    try {
      const response = await axios.post("http://localhost:8000/chatbot/ask");

      const processedResponse = response.data.result
        .replace(/\*/g, "")
        .replace(/\s+/g, " ")
        .trim();

      setGeminiResponse(processedResponse);
      setHindiText(response.data.hindiText);
    //   speakText(processedResponse);
    } catch (error) {
      console.error("Error:", error);
      setGeminiResponse("An error occurred while processing your request.");
      setError("Failed to get response from server.");
    } finally {
      setRecording(false);
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      synth.cancel();
      setSpeaking(true);
      setPaused(false);
      setError(null);

      if (!text) {
        setError("No text available to speak.");
        return;
      }

      utteranceRef.current = new SpeechSynthesisUtterance(text);
      utteranceRef.current.lang = 'hi-IN';
      utteranceRef.current.rate = 0.9;
      utteranceRef.current.pitch = 1;

      utteranceRef.current.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };

      utteranceRef.current.onerror = (event) => {
        console.error("SpeechSynthesis error", event);
        setSpeaking(false);
        setPaused(false);
        if (event.error === "interrupted" || event.error === "canceled") {
          setError("Speech was interrupted. You can try speaking again.");
        } else {
          setError(`Speech synthesis error: ${event.error}`);
        }
      };

      synth.speak(utteranceRef.current);
    } else {
      setError('Text-to-speech is not supported in your browser. Please try a different browser.');
    }
  };

  const toggleSpeech = () => {
    if (speaking && !paused) {
      synth.pause();
      setPaused(true);
    } else if (paused) {
      synth.resume();
      setPaused(false);
    } else {
      speakText(geminiResponse);
    }
  };

  const stopSpeech = () => {
    synth.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  const retrySpeech = () => {
    setError(null);
    speakText(geminiResponse);
  };

  return (
    <div className=" bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-3xl overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              KrushiMitra
            </h1>

            <div className="space-y-4">
              <div className="flex justify-center mb-8 space-x-4">
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className={`flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300 ${
                    recording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  {recording ? (
                    <>
                      <StopIcon className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <MicrophoneIcon className="h-5 w-5 mr-2" />
                      Start Recording
                    </>
                  )}
                </button>

                <button
                  onClick={toggleSpeech}
                  disabled={!geminiResponse || loading}
                  className={`flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300 ${
                    geminiResponse && !loading
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {speaking && !paused ? (
                    <>
                      <PauseIcon className="h-5 w-5 mr-2" />
                      Pause Speech
                    </>
                  ) : paused ? (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Resume Speech
                    </>
                  ) : (
                    <>
                      <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                      Speak Response
                    </>
                  )}
                </button>

                {speaking && (
                  <button
                    onClick={stopSpeech}
                    className="flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300 bg-red-600 hover:bg-red-700"
                  >
                    <StopIcon className="h-5 w-5 mr-2" />
                    Stop Speech
                  </button>
                )}

                {error && (
                  <button
                    onClick={retrySpeech}
                    className="flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Retry Speech
                  </button>
                )}
              </div>

              {loading && (
                <div className="flex justify-center items-center space-x-2 mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                  <span className="text-cyan-600 font-semibold">Loading...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                  <p>{error}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Hindi Text:
                </h3>
                <p className="text-gray-700">
                  {hindiText || "No text available"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  KrushiMitra Response:
                </h3>
                <p className="text-gray-700">
                  {geminiResponse || "No response available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}