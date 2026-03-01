const FROM_NAME = "VonWillingh LMS";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "no-reply@vonwillingh.ac.za";

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.BREVO_API_KEY || !to) return;
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
    });
  } catch {
    console.error("Brevo email send failed");
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
