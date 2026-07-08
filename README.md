# AI Internal Knowledge Base Chatbot

This project is a custom Retrieval-Augmented Generation (RAG) chatbot built to answer questions based strictly on a company's internal documents and a curated set of Manual Q&A pairs.

## Core Technologies

* Framework: SvelteKit
* Styling: Tailwind CSS & shadcn-svelte
* Database: Supabase with pgvector for vector search
* LLM & Embeddings: OpenAI (GPT models and text embeddings)

## Key Functionalities

### 1. Document Upload and Processing
* Users can upload company documents (such as PDF, DOCX, or plain text) into the knowledge base.
* Uploaded documents are automatically parsed, split into smaller manageable chunks, and converted into mathematical vector embeddings.
* These embeddings are stored securely in Supabase using the pgvector extension for high-performance similarity search.

### 2. Manual Q&A Overrides
* The system allows administrators to add explicit Manual Question & Answer pairs.
* These Q&A pairs act as the "absolute truth". If a user asks a question where the Manual Q&A conflicts with a regular uploaded document, the chatbot is strictly instructed to prioritize and output the Manual Q&A answer.

### 3. Context-Strict RAG (Retrieval-Augmented Generation)
* When a user submits a query, the system converts it to a vector and performs a similarity search across the database.
* The chatbot retrieves the top most relevant chunks from the uploaded documents and the Manual Q&A pairs.
* The chatbot strictly answers questions based ONLY on the retrieved context.
* If a user asks a question entirely unrelated to the provided company knowledge, the chatbot refuses to hallucinate and responds with: "Please ask questions related to the company."

### 4. Interactive Chat Interface
* Provides a clean, interactive chat interface where users can converse with the AI.
* Automatically creates and persists chat sessions (Conversations).
* Saves message history to the database, allowing users to return to previous conversations.
* Responses are streamed in real-time back to the user interface.

### 5. Authentication
* The application is secured via Supabase Authentication.
* Only authenticated users can access the chat interface, upload documents, and manage the knowledge base.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
