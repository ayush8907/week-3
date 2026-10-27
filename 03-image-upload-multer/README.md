# Image Upload API

A simple image upload application built using Node.js, Express, and Multer. It supports image uploads, file validation, and serving uploaded images through URLs.

## Features

- Upload images using the Multer middleware.
- Accept image files only.
- Limit file size to 5 MB.
- Generate unique filenames for uploaded images.
- Access uploaded images through URLs.
- Handle upload errors with appropriate responses.

## Tech Stack

- Node.js
- Express.js
- Multer
- CORS

## Installation

1. Install [Node.js](https://nodejs.org/).
2. Install project dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open `http://localhost:5002` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check whether the API is running |
| POST | `/api/upload` | Upload an image |

For image uploads, send a `multipart/form-data` request to `/api/upload` with a file field named `image`.

## Upload Response

A successful upload returns the filename, original filename, file size, and image URL.

## Project Structure

```text
03-image-upload-multer/
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── uploads/
    └── .gitkeep
```

Uploaded images are stored in the `uploads/` folder. The folder is excluded from Git tracking to avoid committing uploaded files.