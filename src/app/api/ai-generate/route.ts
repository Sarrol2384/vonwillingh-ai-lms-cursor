import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface GeneratedUnit {
  title: string;
  content: string;
  video_topic?: string;
}
interface GeneratedModule {
  title: string;
  description: string;
  units: GeneratedUnit[];
}
interface GeneratedCourse {
  title: string;
  code: string;
  description: string;
  modules: GeneratedModule[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "lecturer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in environment variables" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const body = await request.json();
  const { courseTitle, nqfLevel, numModules } = body as {
    courseTitle: string;
    nqfLevel: number;
    numModules: number;
  };
  if (!courseTitle || !nqfLevel || !numModules) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const prompt = `Create a complete course structure for a South African university course.

Course title: "${courseTitle}"
NQF level: ${nqfLevel}
Number of modules: ${numModules}

Generate the course structure as valid JSON with this exact shape:
{
  "title": "string",
  "code": "string (e.g. CS101 - make it relevant)",
  "description": "string",
  "modules": [
    {
      "title": "string",
      "description": "string",
      "units": [
        {
          "title": "string",
          "content": "string (2-3 paragraphs of educational content)",
          "video_topic": "string (optional YouTube search topic)"
        }
      ]
    }
  ]
}

Requirements:
- Each module must have 2-3 units
- Content must be appropriate for NQF level ${nqfLevel}
- Use South African context where relevant
- Output only valid JSON, no extra text`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });

    const generated: GeneratedCourse = JSON.parse(jsonMatch[0]);

    // Save to database
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: generated.title,
        code: generated.code,
        description: generated.description,
        nqf_level: nqfLevel,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });

    for (let mi = 0; mi < generated.modules.length; mi++) {
      const mod = generated.modules[mi];
      const { data: module, error: modError } = await supabase
        .from("modules")
        .insert({
          course_id: course.id,
          title: mod.title,
          description: mod.description,
          sequence_order: mi,
        })
        .select("id")
        .single();
      if (modError) continue;

      for (let ui = 0; ui < mod.units.length; ui++) {
        const unit = mod.units[ui];
        await supabase.from("units").insert({
          module_id: module.id,
          title: unit.title,
          content: unit.content,
          video_url: unit.video_topic
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(unit.video_topic)}`
            : null,
          sequence_order: ui,
        });
      }
    }

    return NextResponse.json({ courseId: course.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
