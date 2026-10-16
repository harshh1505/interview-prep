import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient, logAdminAuditAction } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const SEED_PROGRAMS = [
  {
    title: "Full-Stack Software Engineering Track",
    description: "Core algorithms, distributed systems, React, Node.js, and system architecture.",
    domain: "Software Engineering",
    status: "active",
  },
  {
    title: "Frontend Engineering & Web Performance Track",
    description: "Core Web Vitals, SSR, React internals, CSS architecture, and browser optimization.",
    domain: "Frontend",
    status: "active",
  },
  {
    title: "Generative AI & LLM Systems Track",
    description: "RAG architectures, vector databases (Pinecone), prompt engineering, and agentic workflows.",
    domain: "AI / ML",
    status: "active",
  },
  {
    title: "Platform & Cloud Security Track",
    description: "Zero Trust architecture, OAuth 2.1, IAM policies, container security, and CI/CD audit.",
    domain: "Security",
    status: "active",
  },
];

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const { data: dbPrograms, error } = await supabase.from("programs").select("*").order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch enrollments count per program
    const { data: enrollments } = await supabase.from("program_enrollments").select("program_id, status");

    const enrollmentMap: Record<string, { count: number; completed: number }> = {};
    (enrollments || []).forEach((e) => {
      if (!enrollmentMap[e.program_id]) {
        enrollmentMap[e.program_id] = { count: 0, completed: 0 };
      }
      enrollmentMap[e.program_id].count += 1;
      if (e.status === "completed") enrollmentMap[e.program_id].completed += 1;
    });

    const formattedPrograms = (dbPrograms || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      domain: p.domain || "General",
      status: p.status || "active",
      enrolledCount: enrollmentMap[p.id]?.count || 0,
      completionRate: enrollmentMap[p.id]?.count
        ? Math.round((enrollmentMap[p.id].completed / enrollmentMap[p.id].count) * 100)
        : 0,
      createdAt: p.created_at,
    }));

    return NextResponse.json({
      success: true,
      programs: formattedPrograms,
    });
  } catch (err: any) {
    console.error("Admin programs API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch programs", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const body = await request.json();
    const { title, description, domain, status, action } = body;

    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    // Action: Seed default programs
    if (action === "seed") {
      const inserted: any[] = [];
      for (const prog of SEED_PROGRAMS) {
        const { data } = await supabase.from("programs").insert(prog).select().single();
        if (data) inserted.push(data);
      }

      await logAdminAuditAction({
        adminUserId: auth.user!.id,
        action: "SEED_DEFAULT_PROGRAMS",
        targetType: "programs",
        metadata: { count: inserted.length },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${inserted.length} tracks into Supabase database.`,
        programs: inserted,
      });
    }

    if (!title) {
      return NextResponse.json({ error: "Program title is required." }, { status: 400 });
    }

    const newProgram = {
      title,
      description: description || "",
      domain: domain || "General",
      status: status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("programs").insert(newProgram).select().single();

    if (error) throw error;

    await logAdminAuditAction({
      adminUserId: auth.user!.id,
      action: "CREATE_PROGRAM",
      targetType: "program",
      targetId: data?.id,
      metadata: { title, domain },
    });

    return NextResponse.json({
      success: true,
      program: data || newProgram,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create program", details: err.message },
      { status: 500 }
    );
  }
}

