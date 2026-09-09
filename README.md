# HireWire

🔗 **Live Demo:** [https://hirewire-xu1p.onrender.com/](https://hirewire-xu1p.onrender.com/)

An AI-powered mock interview platform that simulates real technical and behavioral interviews with voice interaction, a live code editor, and instant feedback scorecards.

## Features

- Real-time voice conversation with an AI interviewer
- Integrated code editor (Monaco) with live test execution
- STAR-framework guided behavioral interview practice
- Instant scorecards evaluating code correctness, communication, and structure
- Configurable timers and interview modes

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Database/Auth:** Firebase Firestore, Firebase Authentication

## Getting Started

### Prerequisites

- Node.js installed
- A Gemini API key
- A Firebase project set up

### Installation

\`\`\`bash
git clone https://github.com/deepika-cs-learn/hirewire.git
cd hirewire
npm install
\`\`\`

### Environment Variables

Create a `.env` file in the root directory:

\`\`\`
VITE_GEMINI_API_KEY=your_key_here
\`\`\`

### Running Locally

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

## License

This project is for educational/hackathon purposes.
