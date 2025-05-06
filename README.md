# ShareText

A lightweight, fast text sharing web application that allows users to share text snippets with unique URLs. The application is designed to be simple, secure, and efficient.

## Features

- Instant text sharing with unique URLs
- No user registration required
- Automatic code generation
- Password protection option
- Expiration timer for shared texts
- Syntax highlighting for code
- QR code generation for easy sharing
- Dark/light mode toggle
- Markdown preview
- Mobile responsive design

## Technology Stack

- **Backend**: Node.js with Express.js
- **Storage**: JSON file-based (no database)
- **Frontend**: HTML, CSS, JavaScript

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Visit `http://localhost:3000` in your browser

## API Endpoints

- `POST /api/text` - Create a new text snippet
- `GET /api/text/:id` - Retrieve a text snippet by ID
- `DELETE /api/text/:id` - Delete a text snippet (if password provided)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
