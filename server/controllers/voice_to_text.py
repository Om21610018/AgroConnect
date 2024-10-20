import speech_recognition as sr
import sys

# Ensure UTF-8 encoding is used throughout
sys.stdout.reconfigure(encoding='utf-8')

def takeCommandHindi():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        # print('Listening...')
        r.pause_threshold = 0.7
        audio = r.listen(source)

        try:
            # print("Recognizing...")
            query = r.recognize_google(audio, language='hi-IN')
            # print(f"Query recognized: {query}")
        except Exception as e:
            print(f"Error: {e}")
            return "None"
        return query

if __name__ == "__main__":
    print(takeCommandHindi())
