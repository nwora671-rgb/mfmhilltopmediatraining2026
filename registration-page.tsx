"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

const categories = [
  "Graphics Design", "Photography", "Videography", "Video Editing",
  "Live Streaming & Broadcasting", "Audio & Sound Engineering",
  "Projection & Presentation", "Social Media Management", "Content Creation",
  "Media Team Management", "Artificial Intelligence (AI) Creation",
  "Website Design & Development",
];

const makeCode = (id: string) =>
  "MFM26-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();

function makePDF(d: {
  name: string; code: string; phone: string; email: string; branch: string;
  first: string; second: string; date: string;
}) {
  const pdf = new jsPDF();
  const x = 18;
  const width = pdf.internal.pageSize.getWidth();

  pdf.setTextColor(20, 43, 74);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("MFM HILLTOP ZONAL HEADQUARTERS", width / 2, 22, { align: "center" });

  pdf.setTextColor(179, 38, 45);
  pdf.setFontSize(13);
  pdf.text("MEDIA TRAINING 2026", width / 2, 31, { align: "center" });
  pdf.setDrawColor(179, 38, 45);
  pdf.line(x, 38, width - x, 38);

  pdf.setTextColor(20, 43, 74);
  pdf.setFontSize(15);
  pdf.text("FREE REGISTRATION CONFIRMATION", width / 2, 51, { align: "center" });

  const rows = [
    ["Registration number", d.code],
    ["Participant name", d.name],
    ["Phone", d.phone],
    ["Email", d.email],
    ["Church branch", d.branch],
    ["First choice", d.first],
    ["Second choice", d.second || "Not selected"],
    ["Registration date", d.date],
  ];

  let y = 68;
  pdf.setFontSize(10);
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label + ":", x, y);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(value || "-", 115);
    pdf.text(lines, 65, y);
    y += Math.max(8, lines.length * 5 + 2);
  });

  y += 5;
  pdf.setTextColor(24, 91, 43);
  pdf.setFont("helvetica", "bold");
  pdf.text("REGISTRATION STATUS: CONFIRMED", x, y);
  y += 9;

  pdf.setTextColor(45, 55, 65);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    pdf.splitTextToSize(
      "Your free registration has been received successfully. Keep this confirmation for your records.",
      width - 2 * x
    ),
    x,
    y
  );

  y += 22;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 43, 74);
  pdf.text("TRAINING INFORMATION", x, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(45, 55, 65);
  [
    "Dates: 21, 22, 23, 28, 29 and 30 December 2026",
    "Time: 10:00 AM daily",
    "Venue: Church Auditorium, 14 Comrade Sunday Ekuma Street, off Hilltop Road, after SS Field, behind the MTN mast, Abakaliki, Ebonyi State, Nigeria.",
    "Registration fee: FREE",
  ].forEach((line) => {
    const lines = pdf.splitTextToSize(line, width - 2 * x);
    pdf.text(lines, x, y);
    y += lines.length * 5 + 3;
  });

  pdf.save(`${d.code}-Registration-Confirmation.pdf`);
}

export default function RegistrationPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setCode("");

    const form = e.currentTarget;
    const f = new FormData(form);

    setBusy(true);

    const name = String(f.get("full_name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const email = String(f.get("email") || "").trim();
    const branch = String(f.get("church_branch") || "").trim();
    const assembly = String(f.get("assembly") || "").trim();
    const first = String(f.get("first_choice") || "");
    const second = String(f.get("second_choice") || "");
    const experience = String(f.get("experience") || "");

    try {
      const { data, error } = await supabase
        .from("registrations")
        .insert({
          full_name: name,
          phone,
          email,
          church_branch: branch,
          assembly: assembly || null,
          first_choice: first,
          second_choice: second || null,
          experience,
          payment_status: "not_required",
          registration_status: "approved",
          payment_reference: null,
          receipt_path: null,
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Registration could not be saved.");
      }

      // The Supabase database trigger assigns the same registration code
      // before the row is saved, so no extra public UPDATE permission is needed.
      const registrationCode = makeCode(data.id);

      const date = new Date().toLocaleDateString("en-NG", {
        day: "numeric", month: "long", year: "numeric",
      });

      setCode(registrationCode);
      setMessage("Registration successful! Your free registration confirmation PDF is downloading.");
      makePDF({ name, code: registrationCode, phone, email, branch, first, second, date });
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="registrationPage">
      <section className="card">
        <p className="eyebrow">MFM HILLTOP ZONAL HEADQUARTERS</p>
        <h1>MEDIA TRAINING 2026</h1>
        <p className="tagline">LEARN • CREATE • SERVE</p>

        <div className="details">
          <p><b>Dates:</b> 21, 22, 23, 28, 29 and 30 December 2026</p>
          <p><b>Time:</b> 10:00 AM daily</p>
          <p><b>Venue:</b> Church Auditorium, 14 Comrade Sunday Ekuma Street, off Hilltop Road, after SS Field, behind the MTN mast, Abakaliki, Ebonyi State, Nigeria.</p>
          <p><b>Registration fee:</b> FREE</p>
          <p><b>Eligibility:</b> MFM members only, including other MFM branches.</p>
        </div>

        <form onSubmit={submit}>
          <label>Full name *<input name="full_name" required /></label>
          <label>Phone number *<input name="phone" type="tel" required /></label>
          <label>Email address *<input name="email" type="email" required /></label>
          <label>Church branch *<input name="church_branch" required /></label>
          <label>Assembly<input name="assembly" /></label>

          <label>First choice category *
            <select name="first_choice" required defaultValue="">
              <option value="" disabled>Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>Second choice category
            <select name="second_choice" defaultValue="">
              <option value="">No second choice</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>Previous experience
            <select name="experience" defaultValue="Beginner">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <button type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Register for free"}
          </button>
        </form>

        {message && (
          <div className="message" role="status">
            <p>{message}</p>
            {code && <b>Registration number: {code}</b>}
          </div>
        )}

        <p className="fine">Your information is used for MFM Hilltop Media Training administration.</p>
      </section>

      <style jsx>{`
        .registrationPage{min-height:100vh;padding:28px 14px;background:#f2f5f8;color:#243244}
        .card{max-width:760px;margin:auto;background:#fff;padding:26px;border-radius:14px;box-shadow:0 8px 28px #142b4a18}
        .eyebrow,.tagline{text-align:center;color:#b3262d;font-weight:700;letter-spacing:.06em}
        h1{text-align:center;color:#142b4a}
        .details{background:#f5f7fa;padding:15px;border-radius:9px;margin:20px 0}
        form{display:grid;grid-template-columns:1fr 1fr;gap:15px}
        label{display:flex;flex-direction:column;gap:7px;font-size:14px;font-weight:600}
        input,select{width:100%;min-height:43px;padding:9px;border:1px solid #ccd4df;border-radius:7px;background:white;color:#243244}
        button{grid-column:1/-1;min-height:48px;border:0;border-radius:8px;background:#142b4a;color:white;font-weight:700}
        button:disabled{opacity:.6}
        .message{margin-top:18px;padding:14px;background:#edf8ef;color:#185b2b;border-radius:8px}
        .fine{font-size:12px;color:#667085;text-align:center;margin-top:18px}
        @media(max-width:600px){.card{padding:17px}form{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
