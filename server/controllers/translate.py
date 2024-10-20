import sys
import io
import grpc
import riva.client.proto.riva_nmt_pb2 as riva_nmt
import riva.client.proto.riva_nmt_pb2_grpc as riva_nmt_srv
import riva.client

# Redirect stdout to use utf-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def translate(text, source_language_code, target_language_code):
    server = "grpc.nvcf.nvidia.com:443"
    use_ssl = True
    ssl_cert = None
    function_id = "647147c1-9c23-496c-8304-2e29e7574510"
    authorization_token = "Bearer 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"

    metadata = [
        ("function-id", function_id),
        ("authorization", authorization_token)
    ]

    auth = riva.client.Auth(ssl_cert, use_ssl, server, metadata)
    nmt_client = riva.client.NeuralMachineTranslationClient(auth)

    try:
        response = nmt_client.translate([text], "", source_language_code, target_language_code)
        return response.translations[0].text
    except grpc.RpcError as e:
        print(f"Error: {e.code()} - {e.details()}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python translate.py <text> <source_lang> <target_lang>", file=sys.stderr)
        sys.exit(1)

    text = sys.argv[1]
    source_lang = sys.argv[2]
    target_lang = sys.argv[3]

    translated_text = translate(text, source_lang, target_lang)
    print(translated_text)