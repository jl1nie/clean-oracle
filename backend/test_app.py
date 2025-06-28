import pytest
import os
import json
from unittest.mock import patch, MagicMock
from app import app, IMAGE_DIR, encode_image_to_base64

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def setup_and_teardown_image_dir():
    # Ensure IMAGE_DIR exists before tests
    if not os.path.exists(IMAGE_DIR):
        os.makedirs(IMAGE_DIR)
    
    # Clean up IMAGE_DIR after tests
    yield
    for f in os.listdir(IMAGE_DIR):
        os.remove(os.path.join(IMAGE_DIR, f))

def test_register_no_image(client):
    response = client.post('/api/register')
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "No image provided"}

def test_register_success(client):
    # Create a dummy image file
    dummy_image_path = os.path.join(IMAGE_DIR, "test_image.jpg")
    with open(dummy_image_path, "w") as f:
        f.write("dummy image content")

    with open(dummy_image_path, "rb") as img:
        response = client.post(
            '/api/register',
            data={'image': (img, 'test_image.jpg')},
            content_type='multipart/form-data'
        )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "uuid" in data
    assert os.path.exists(os.path.join(IMAGE_DIR, data["uuid"] + ".jpg")) # Check if file was saved

def test_oracle_missing_parameters(client):
    response = client.post('/api/oracle')
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "Missing required parameters"}

def test_oracle_reference_image_not_found(client):
    # Create a dummy image file for the uploaded image
    dummy_uploaded_image_path = os.path.join(IMAGE_DIR, "uploaded_test_image.jpg")
    with open(dummy_uploaded_image_path, "w") as f:
        f.write("dummy uploaded image content")

    with open(dummy_uploaded_image_path, "rb") as img:
        response = client.post(
            '/api/oracle',
            data={
                'reference_uuid': 'non_existent_uuid',
                'image': (img, 'uploaded_test_image.jpg'),
                'config': json.dumps({"type": "Male"})
            },
            content_type='multipart/form-data'
        )
    assert response.status_code == 404
    assert json.loads(response.data) == {"error": "Reference image not found"}

@patch('app.requests.post')
def test_oracle_success(mock_post, client):
    # Mock LLM response
    mock_post.return_value = MagicMock(
        status_code=200,
        json=lambda: {
            'choices': [{'message': {'content': '<html>神託です。点数: 80</html>'}}]
        }
    )
    mock_post.return_value.raise_for_status.return_value = None

    # Create dummy reference and uploaded image files
    ref_uuid = "test_ref_uuid"
    dummy_ref_image_path = os.path.join(IMAGE_DIR, f"{ref_uuid}.jpg")
    with open(dummy_ref_image_path, "w") as f:
        f.write("dummy reference image content")

    dummy_uploaded_image_path = os.path.join(IMAGE_DIR, "uploaded_test_image.jpg")
    with open(dummy_uploaded_image_path, "w") as f:
        f.write("dummy uploaded image content")

    with open(dummy_uploaded_image_path, "rb") as img:
        response = client.post(
            '/api/oracle',
            data={
                'reference_uuid': ref_uuid,
                'image': (img, 'uploaded_test_image.jpg'),
                'config': json.dumps({"type": "Male"})
            },
            content_type='multipart/form-data'
        )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "point" in data
    assert data["point"] == 80
    assert mock_post.called # Ensure LLM was called
    
    # Clean up dummy files
    os.remove(dummy_ref_image_path)
    os.remove(dummy_uploaded_image_path)
