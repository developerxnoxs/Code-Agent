// Referenced from javascript_gemini blueprint
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export interface CodeGenerationRequest {
  prompt: string;
  context?: string;
  language?: string;
}

export interface CodeAnalysisResult {
  issues: { type: string; message: string; line?: number }[];
  suggestions: string[];
  complexity: string;
}

export async function generateCode(request: CodeGenerationRequest): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  const systemPrompt = `You are an expert software engineer. Generate clean, production-ready code based on the user's requirements.
${request.language ? `Language: ${request.language}` : ""}
${request.context ? `Context: ${request.context}` : ""}

Provide only the code without explanations unless specifically asked.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    config: {
      systemInstruction: systemPrompt,
    },
    contents: request.prompt,
  });

  return response.text || "";
}

export async function analyzeCode(code: string, language?: string): Promise<CodeAnalysisResult> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  const systemPrompt = `You are a code analysis expert. Analyze the provided code and identify:
1. Bugs and potential issues
2. Code quality improvements
3. Performance optimizations
4. Best practices violations

Respond with JSON in this exact format:
{
  "issues": [{"type": "error|warning|info", "message": "description", "line": number}],
  "suggestions": ["suggestion1", "suggestion2"],
  "complexity": "low|medium|high"
}`;

  const prompt = `Analyze this ${language || "code"}:\n\n${code}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                message: { type: "string" },
                line: { type: "number" },
              },
              required: ["type", "message"],
            },
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
          },
          complexity: { type: "string" },
        },
        required: ["issues", "suggestions", "complexity"],
      },
    },
    contents: prompt,
  });

  return JSON.parse(response.text || "{}");
}

export async function fixBug(code: string, errorDescription: string, language?: string): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  const prompt = `Fix the following bug in this ${language || "code"}:

Error: ${errorDescription}

Code:
${code}

Provide the corrected code only.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  return response.text || "";
}

export async function explainCode(code: string, language?: string): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  const prompt = `Explain what this ${language || "code"} does in simple terms:\n\n${code}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  return response.text || "";
}

export async function generateFileStructure(projectDescription: string): Promise<{ files: { path: string; content: string }[] }> {
  if (!ai) {
    throw new Error("Gemini API is not configured. Please set GEMINI_API_KEY environment variable.");
  }

  const systemPrompt = `You are a project structure expert. Generate a complete file structure for a project based on the description.

Respond with JSON in this exact format:
{
  "files": [
    {"path": "file/path.ext", "content": "file content"},
    ...
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                content: { type: "string" },
              },
              required: ["path", "content"],
            },
          },
        },
        required: ["files"],
      },
    },
    contents: `Generate a file structure for: ${projectDescription}`,
  });

  return JSON.parse(response.text || '{"files":[]}');
}
