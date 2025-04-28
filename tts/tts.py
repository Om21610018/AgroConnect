from gtts import gTTS

text = "तुमचं स्वागत आहे"
tts = gTTS(text, lang='mr')
tts.save("G:/Project/AgroConnect/client/src/audio/marathi.mp3")
