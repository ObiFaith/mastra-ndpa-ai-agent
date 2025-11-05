# NDPA AI Agent — Nigeria Data Protection Assistant

## Description

The NDPA AI Agent is an intelligent assistant built to understand, query, and explain the Nigeria Data Protection Act (NDPA).

It allows users to ask natural-language questions — like “`What are the rights of data subjects?`” or “`What are the powers of the Commission?`” — and get accurate, well-referenced answers directly from the Act.

The agent leverages the `Mastra AI framework` with structured JSON knowledge extracted from the NDPA, making it ideal for legal awareness, compliance guidance, and educational purposes.

## Features

- **Context-Aware Legal Querying**: Understands specific parts, sections, and provisions of the NDPA.

- **Structured JSON Knowledge Base**: Uses a well-organized ndpa-structured.json file for precise retrieval.

- **Conversational Responses**: Answers in clear, human-friendly explanations.

- **Section Reference Support**: Can locate, summarize, or quote any section of the Act.

- **Integration-Ready**: Can be connected to Telex (A2A protocol) or embedded in websites, chatbots, or compliance tools.

## Project Structure

```bash
ndpa-agent/
├── mastra/
│ ├── ndpa-agent.ts # Main AI agent definition (using Mastra AI)
│ ├── ndpa-scorer.ts # Optional scorer for evaluating accuracy or completeness
│ ├── tools/
│ │ └── ndpaTool.ts # Tool that loads and searches the NDPA JSON
│ └── data/
│ └── ndpa-structured.json # Structured NDPA text (Parts, Sections, etc.)
├── package.json
└── README.md
```

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Set environment variables

You’ll need an AI provider key supported by **Mastra AI**, such as `Groq`, `Gemini`, or `OpenAI`.

**Example:**

```sh
GROQ_API_KEY="your-key-here"
```

### 3. Run the agent locally

```sh
npm run dev
```

### 4. Query the agent

Once running, you can chat with the `NDPA AI Agent` through your preferred interface (eg; Telex).

**Query Example**

> What is the objective of the NDPA?

> What does Section 4 establish?

> Who appoints the National Commissioner?

### Configuration Notes

- The agent uses a retrieval-based context loader built around ndpa-structured.json.
- For `best results`, ensure your JSON is:
  Properly structured with `"part_number", "section_number", "title", and "content".`
- Numbered sequentially (no missing sections).

**Note:** You can modify the JSON to include related laws or NDPR references later.

### Example Query Flow

**User**: What are the objectives of the Act?

**NDPA Agent**:
The NDPA’s objectives, found in Part I, Section 1, include safeguarding data subjects’ rights, ensuring lawful processing, and promoting a secure and trusted digital economy.

### Future Extensions

- Add a compliance checklist generator.

- Integrate document upload & analysis (e.g., checking if a company privacy policy aligns with NDPA).
- Connect to Telex via A2A protocol for workspace-based interactions.
