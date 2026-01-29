# Witness Testimony Prep Tools

AI-powered tools for witness testimony preparation and deposition planning.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Case.dev](https://img.shields.io/badge/Powered%20by-Case.dev-orange)](https://case.dev)

## Overview

This application provides two AI-powered legal preparation tools:

- **Testimony Prep Tool**: Prepare witnesses for cross-examination with AI-generated questions. Upload case documents, generate challenging questions, and practice with an AI examiner that provides real-time feedback.

- **Deposition Prep Tool**: Strategic deposition planning with document analysis, testimony gap identification, contradiction detection, and question outline generation.

## Case.dev Integration

This application uses the [Case.dev API](https://case.dev) for AI capabilities:

| API | Usage |
|-----|-------|
| **LLM API** | Generates cross-examination questions, analyzes witness responses, provides feedback |
| **OCR API** | Extracts text from uploaded PDF documents |

All document storage is handled client-side via localStorage—no server-side database required.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A [Case.dev](https://case.dev) API key

### Installation

```bash
git clone https://github.com/CaseMark/witness-testimony-prep-OSS.git
cd witness-testimony-prep-OSS
npm install
```

### Configuration

```bash
cp .env.example .env.local
```

Add your Case.dev API key to `.env.local`:

```env
CASE_API_KEY=sk_case_your_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your API key to authenticate.

## How It Works

### Testimony Prep Tool

1. **Upload Documents**: Upload case documents (PDF, DOCX, TXT) containing depositions, witness statements, or exhibits
2. **Generate Questions**: AI analyzes documents and generates 20 cross-examination questions categorized by type (timeline, credibility, inconsistency, etc.)
3. **Practice Mode**: Answer questions while an AI examiner evaluates responses and suggests follow-up questions
4. **Review**: See your practice history and feedback

### Deposition Prep Tool

1. **Upload Documents**: Upload prior testimony, case files, and exhibits
2. **Analysis**: AI identifies testimony gaps, contradictions, and key themes
3. **Question Generation**: Get strategic deposition questions organized by topic and priority
4. **Outline**: Export a structured deposition outline

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── testimony/           # Testimony prep endpoints
│   │   │   ├── generate-questions/
│   │   │   ├── practice/
│   │   │   └── ocr/
│   │   ├── deposition/          # Deposition prep endpoints
│   │   ├── login/               # Authentication
│   │   └── verify-key/          # API key validation
│   ├── login/                   # Login page
│   └── page.tsx                 # Main tool selector
├── components/
│   ├── testimony/               # Testimony prep UI
│   ├── deposition/              # Deposition prep UI
│   └── ui/                      # Shared UI components
├── lib/
│   ├── case-dev/                # Case.dev API client
│   ├── storage/                 # localStorage utilities
│   └── types/                   # TypeScript definitions
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/testimony/generate-questions` | POST | Generate cross-examination questions |
| `/api/testimony/practice` | POST | Submit answer and get AI feedback |
| `/api/testimony/ocr` | POST | Process document text |
| `/api/deposition/generate-questions` | POST | Generate deposition questions and analysis |
| `/api/verify-key` | POST | Validate Case.dev API key |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Icons**: Phosphor Icons
- **AI**: Case.dev API (LLM + OCR)
- **Storage**: Client-side localStorage

## License

[Apache 2.0](LICENSE)

## Links

- [Case.dev](https://case.dev) - AI infrastructure for legal applications
- [Case.dev Documentation](https://docs.case.dev) - API documentation
