const FROM = process.env.EMAIL_FROM ?? "VonWillingh LMS <no-reply@vonwillingh.ac.za>";

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, text });
  } catch {
    // Non-fatal — log but don't throw
    console.error("Email send failed");
  }
}

export async function sendRegistrationApproved(to: string, studentName: string, courseTitle: string) {
  await sendEmail(
    to,
    `Registration approved – ${courseTitle}`,
    `Dear ${studentName},\n\nYour registration for "${courseTitle}" has been approved. You can now access the course on VonWillingh AI LMS.\n\nGood luck!\nVonWillingh AI LMS`
  );
}

export async function sendRegistrationRejected(to: string, studentName: string, courseTitle: string) {
  await sendEmail(
    to,
    `Registration not approved – ${courseTitle}`,
    `Dear ${studentName},\n\nYour registration for "${courseTitle}" was not approved. Please contact the administrator.\n\nVonWillingh AI LMS`
  );
}

export async function sendAssignmentGraded(
  to: string,
  studentName: string,
  moduleTitle: string,
  score: number,
  feedback?: string | null
) {
  const passed = score >= 50 ? "PASSED" : "FAILED";
  await sendEmail(
    to,
    `Assignment graded – ${moduleTitle}`,
    `Dear ${studentName},\n\nYour assignment for "${moduleTitle}" has been graded.\n\nScore: ${score}% – ${passed}\n${feedback ? `Feedback: ${feedback}\n` : ""}\nVonWillingh AI LMS`
  );
}
