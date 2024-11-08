import requests
from huggingface_hub import InferenceClient
from flask import jsonify

# Hugging Face Inference API URL for BLIP Image Captioning
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base"
HUGGINGFACE_API_KEY = "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"  # Replace with your API key

def generate_description(image_url):
    """
    Generate a description for the given image URL using Hugging Face's API.

    Args:
    - image_url: URL of the image.

    Returns:
    - A string description of the image.
    """
    # Hugging Face Inference API URL for BLIP Image Captioning
    HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base"

    # Fetch the image from the URL
    response = requests.get(image_url)
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch image from URL."}), 400

    # Prepare the headers with API key
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}"
    }

    # Send the image to Hugging Face API
    image_data = response.content
    #print(image_data)
    try:
        # Send image data in the POST request
        api_response = requests.post(
            HUGGINGFACE_API_URL,
            headers=headers,
            data=image_data
        )

        # Check if the API response is successful
        if api_response.status_code == 200:
            caption = api_response.json()[0]['generated_text']
            return caption
        else:
            # print(f"Error from API: {api_response.status_code}, {api_response.text}")
            return jsonify({"error": f"Error from API: {api_response.status_code}, {api_response.text}"}), 500
    except Exception as e:
        # print(" processss foio")
        return jsonify({"error": str(e)}), 500