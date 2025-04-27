from flask import Flask, request, jsonify
from gtts import gTTS
from datetime import datetime
import os

app = Flask(__name__)

# Output folder
OUTPUT_FOLDER = '/app/audio/'

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

OUTPUT_FOLDER = '/app/audio/'  # container path

@app.route('/marathi-to-speech', methods=['POST'])
def marathi_to_speech():
    data = request.get_json()
    text = data.get("text")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    try:
        tts = gTTS(text=text, lang='mr')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}.mp3"
        filepath = os.path.join(OUTPUT_FOLDER, filename)
        tts.save(filepath)
        return jsonify({"file_path": f"G:/Project/AgroConnect/client/src/audio/{filename}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
