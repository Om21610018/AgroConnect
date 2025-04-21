from flask import Flask, request, jsonify
import torch
import torchaudio
import numpy as np
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

app = Flask(__name__)

# Load model and processor
model_name = "sumedh/wav2vec2-large-xlsr-marathi"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name).to("cpu")
model.gradient_checkpointing_enable()

TARGET_SAMPLE_RATE = 16000

def transcribe_audio(file_path):
    """Transcribe Marathi audio to text."""
    waveform, sample_rate = torchaudio.load(file_path)

    if sample_rate != TARGET_SAMPLE_RATE:
        resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=TARGET_SAMPLE_RATE)
        waveform = resampler(waveform)

    inputs = processor(waveform.squeeze().numpy(), sampling_rate=TARGET_SAMPLE_RATE, return_tensors="pt", padding=True).to("cpu")

    with torch.no_grad():
        logits = model(inputs.input_values, attention_mask=inputs.attention_mask).logits

    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.batch_decode(predicted_ids)[0]

    return transcription

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        audio_file = request.files.get('file')
        if not audio_file:
            return jsonify({"error": "No audio file provided"}), 400

        file_path = "/tmp/audio.wav"
        audio_file.save(file_path)

        transcription = transcribe_audio(file_path)
        return jsonify({"transcription": transcription})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    