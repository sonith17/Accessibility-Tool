from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from models.image2text import generate_description
from googletrans import Translator

app = Flask(__name__)

CORS(app, methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type'], resources={r"/*": {"origins": "*"}})

translator = Translator()  # Initialize the Google Translator
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
HUGGINGFACE_API_KEY = "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"  # Replace with your API key

# Initialize the summarizer using the BART model

# Function to fetch and return the HTML from a given URL
def fetch_and_render_url(url):
    try:
        # Fetch the content from the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad response
        # Parse the HTML with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Modify relative to absolute paths
        for link in soup.find_all('link', href=True):
            link['href'] = urljoin(url, link['href'])

        for img in soup.find_all('img', src=True):
            if img['src'].startswith('/static'):
                img['src'] = urljoin(url, img['src'])

        for a in soup.find_all('a', href=True):
            a['onclick'] = "event.preventDefault();"
            a['href'] = urljoin(url, a['href'])

        # Return the modified HTML content
        return str(soup), response.headers.get('Content-Type', 'text/html')

    except requests.exceptions.RequestException as e:
        return f"Error fetching the URL: {str(e)}", 'text/html'

@app.route('/', methods=['POST'])
def index():
    url = request.json.get('url')
    if url:
        html_content, content_type = fetch_and_render_url(url)
        return Response(html_content, content_type=content_type)
    return Response("No URL provided", content_type='text/plain')

@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        data = request.get_json()

        if 'image' not in data:
            return jsonify({"error": "No image URL provided."}), 400

        image_url = data['image']

        description = generate_description(image_url)

        return jsonify({"description": description})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to handle translations
@app.route('/translate', methods=['POST'])
def translate_text():
    text = request.json.get('text')
    target_lang = request.json.get('target_lang')
    if text and target_lang:
        try:
            translated = translator.translate(text, dest=target_lang)
            return Response(translated.text, content_type='text/plain')
        except Exception as e:
            return Response(f"Translation error: {str(e)}", status=400)
    return Response("Invalid input", status=400)

# Endpoint to summarize text
@app.route('/summarize', methods=['POST'])
def summarize_text():
    try:
        data = request.get_json()
        if 'text' not in data:
            return jsonify({"error": "No text provided."}), 400

        text = data['text']

        headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}"
        }
        payload = {"inputs":text}
        print(payload)
        api_response = requests.post(
            HUGGINGFACE_API_URL,
            headers=headers,
            json=payload
        )

        # Check if the API response is successful
        if api_response.status_code == 200:
            final_summary = api_response.json()
            print(text,"output",final_summary)
            return  Response(final_summary[0]['summary_text'], content_type='text/plain')
        else:
            print(f"Error from API: {api_response.status_code}, {api_response.text}")
            return jsonify({"error": f"Error from API: {api_response.status_code}, {api_response.text}"}), 500

    except Exception as e:
        print(text,"sum err",str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)