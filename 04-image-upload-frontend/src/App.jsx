
import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5002/api/upload";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleImageChange(event) {
    const file = event.target.files[0];

    setMessage("");
    setUploadedImage("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImage(null);
      setPreview("");
      setMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImage(null);
      setPreview("");
      setMessage("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!image) {
      setMessage("Please choose an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    setLoading(true);
    setMessage("");
    setUploadedImage("");

    try {
      const response = await axios.post(API_URL, formData);

      setUploadedImage(response.data.image.url);
      setMessage("Image uploaded successfully!");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Upload failed. Check whether the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="upload-card">
        <p className="eyebrow">IMAGE UPLOAD</p>
        <h1>Share your image</h1>
        <p className="subtitle">
          Choose an image, preview it, and upload it securely to your server.
        </p>

        <label className="file-picker" htmlFor="image">
          <span className="upload-icon">↑</span>
          <strong>Choose an image</strong>
          <span>JPG, PNG, GIF or other image formats · Max 5 MB</span>
        </label>

        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        {preview && (
          <div className="preview-section">
            <p>Image preview</p>
            <img src={preview} alt="Selected image preview" />
            <span>{image?.name}</span>
          </div>
        )}

        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!image || loading}
        >
          {loading ? "Uploading..." : "Upload image"}
        </button>

        {message && (
          <p
            className={
              uploadedImage ? "message success" : "message"
            }
            role="status"
          >
            {message}
          </p>
        )}

        {uploadedImage && (
          <div className="result-section">
            <h2>Uploaded image</h2>
            <img src={uploadedImage} alt="Successfully uploaded" />
            <a href={uploadedImage} target="_blank" rel="noreferrer">
              Open full image
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
