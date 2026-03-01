import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AiGeneratorForm } from "@/components/ai-generator-form";

export default async function AiGeneratorPage() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "lecturer")) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Course Generator</h1>
        <p className="text-muted-foreground">
          Generate a complete course structure with modules and units using Claude AI.
        </p>
      </div>
      <AiGeneratorForm />
    </div>
  );
}
