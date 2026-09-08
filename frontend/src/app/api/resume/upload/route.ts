import { NextResponse } from "next/server";
// @ts-expect-error pdf-parse has no bundled types
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { indexResumeChunks } from "@/lib/pinecone";
import { storage } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = (formData.get("userId") as string) || "00000000-0000-0000-0000-000000000000";

    if (!file) {
      return NextResponse.json({ error: "PDF resume file is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let resumeText = "";
    try {
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text.trim();
    } catch (parseErr) {
      console.error("PDF parse error:", parseErr);
      return NextResponse.json(
        { error: "Failed to read text from PDF. Ensure it is a valid text-based PDF." },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Extracted resume text is too short or empty. Please ensure the PDF has selectable text." },
        { status: 400 }
      );
    }

    // Chunk and index into Pinecone with Gemini embeddings
    const indexResult = await indexResumeChunks({
      userId,
      resumeText,
      fileName: file.name,
    });

    await storage.saveResumeText(userId, resumeText);

    return NextResponse.json({
      ok: true,
      extractedChars: resumeText.length,
      chunkCount: indexResult.chunkCount,
      sections: indexResult.sections,
      sampleChunks: indexResult.sampleChunks,
      storage: indexResult.storage,
      message: `Resume successfully parsed into ${indexResult.chunkCount} semantic chunks and indexed via ${
        indexResult.storage === "pinecone" ? "Pinecone Serverless" : "local vector memory"
      }.`,
    });
  } catch (err) {
    console.error("Resume upload & indexing error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process resume and index into Pinecone" },
      { status: 500 }
    );
  }
}
