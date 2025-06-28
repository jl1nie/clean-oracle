from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import requests
import base64
import json
import re

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Directory to store uploaded images
IMAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "images")

# LLM API URL from environment variable
LLM_API_URL = os.getenv('LLM_API_URL', 'http://localhost:1234/v1/chat/completions') # Default for LMStudio
VISION_LLM_API_URL = os.getenv('VISION_LLM_API_URL', 'http://localhost:1234/v1/chat/completions') # Assuming same endpoint for now

if not os.path.exists(IMAGE_DIR):
    os.makedirs(IMAGE_DIR)

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

@app.route('/api/register', methods=['POST'])
def register():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    image = request.files['image']
    ext = os.path.splitext(image.filename)[1]
    image_uuid = str(uuid.uuid4())
    image_filename = f"{image_uuid}{ext}"
    image_path = os.path.join(IMAGE_DIR, image_filename)
    
    image.save(image_path)
    
    return jsonify({"uuid": image_uuid})

@app.route('/api/oracle', methods=['POST'])
def oracle():
    data = request.form
    if not all(k in data for k in ['reference_uuid', 'config']) or 'image' not in request.files:
        return jsonify({"error": "Missing required parameters"}), 400

    reference_uuid = data['reference_uuid']
    config = json.loads(data['config']) # config is sent as a JSON string
    uploaded_image = request.files['image']

    reference_image_path = None
    temp_uploaded_image_path = None

    try:
        # Find the reference image file
        # Assuming image files are stored as UUID.ext (e.g., 1234-abcd.jpg)
        # We need to glob for the actual file with any extension
        reference_image_files = [f for f in os.listdir(IMAGE_DIR) if f.startswith(reference_uuid)]
        if not reference_image_files:
            return jsonify({"error": "Reference image not found"}), 404
        reference_image_path = os.path.join(IMAGE_DIR, reference_image_files[0])

        # Save the uploaded image temporarily
        temp_uploaded_image_filename = str(uuid.uuid4()) + os.path.splitext(uploaded_image.filename)[1]
        temp_uploaded_image_path = os.path.join(IMAGE_DIR, temp_uploaded_image_filename)
        uploaded_image.save(temp_uploaded_image_path)

        # Encode images to Base64
        encoded_reference_image = encode_image_to_base64(reference_image_path)
        encoded_uploaded_image = encode_image_to_base64(temp_uploaded_image_path)

        # Construct prompt for Vision LLM
        prompt_text = f"""
        与えられた「神の部屋」と「民の部屋」の画像を比較し、「民の部屋」のきれいさを0点から100点で判定し、整理整頓のための神託をHTML形式で返してください。
        「民の部屋」は「神の部屋」と同一位置・同一画角で撮影されているものとします。

        きれいさの判定方法:
            1. 「神の部屋」から「ベッド」「机」「床」を判別し、「民の部屋」でその場所を特定します。
            2. 「民の部屋」から以下の点を判定します:
                a. 「床」に、服や鞄やゴミが放置されていないか。
                b. 「机」の上に、服が放置されていないか、かばんや本が整理されておかれているか。
                c. 「ベッド」の上に、かばんや本がおかれていないか、「ベッド」の上の布団が整理されているか。

            3. 上記の項目をすべて満たした場合を100点とします。配点は「床」50点、「ベッド」30点、「机」20点として、各パートの判定基準に基づいて採点してください。

        出力形式:
        あなたの応答は、以下の構造を持つ単一のHTMLテキストブロックでなければなりません。
        マークダウンのタグ、余分な返答や解説は一切含めないでください。
        神託は必ず整理整頓を促す点数を含む厳かな一文をHTML形式として生成し、その後「床」「ベッド」「机」の各々の整理すべきポイントをシンプルかつ厳かな一文で生成してください。
        例:
        <div><p>神託をここに表示</p></div>
        <div>
            <p>床：服や鞄を片付けよ。</p>
            <p>ベッド：布団を整え、物を置くべからず。</p>
            <p>机：本を整理し、散らかった物を片付けよ。</p>
        </div>
        """

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "神の部屋:"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_reference_image}"}},
                    {"type": "text", "text": "民の部屋:"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_uploaded_image}"}},
                    {"type": "text", "text": prompt_text}
                ]
            }
        ]

        llm_response = requests.post(
            VISION_LLM_API_URL,
            headers={"Content-Type": "application/json"},
            json={
                "model": "gemma-3-27b", # Assuming this is the model name for LMStudio
                "messages": messages,
                "temperature": 0.7,
            }
        )
        llm_response.raise_for_status()
        llm_data = llm_response.json()

        oracle_message = llm_data['choices'][0]['message']['content']
        # Remove markdown code block fences if LLM returns them
        # This handles cases where there might not be a newline immediately after ```html or before ```
        oracle_message = re.sub(r'```html\s*', '', oracle_message)
        oracle_message = re.sub(r'\s*```', '', oracle_message)

        return jsonify({
            "message": oracle_message
        })

    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM API: {e}")
        return jsonify({"error": f"Failed to get oracle from LLM: {e}"}), 500
    except KeyError as e:
        print(f"Error parsing LLM response: {e}")
        return jsonify({"error": f"Failed to parse LLM response: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500
    finally:
        if temp_uploaded_image_path and os.path.exists(temp_uploaded_image_path):
            os.remove(temp_uploaded_image_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
