 "use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

const categories = [
  "Graphics Design",
  "Photography",
  "Videography",
  "Video Editing",
  "Live Streaming & Broadcasting",
  "Audio & Sound Engineering",
  "Projection & Presentation",
  "Social Media Management",
  "Content Creation",
  "Media Team Management",
  "Artificial Intelligence (AI) Creation",
  "Website Design & Development",
];

type ConfirmationData = {
  name: string;
  code: string;
  phone: string;
  email: string;
  branch: string;
  assembly: string;
  first: string;
  second: string;
  date: string;
};

function makePDF(d: ConfirmationData) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 18;
  let y = 22;

  pdf.setTextColor(20, 43, 74);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("MFM HILLTOP ZONAL HEADQUARTERS", pageWidth / 2, y, {
    align: "center",
  });

  y += 9;
  pdf.setTextColor(179, 38, 45);
  pdf.setFontSize(13);
  pdf.text("MEDIA TRAINING 2026", pageWidth / 2, y, { align: "center" });

  y += 8;
  pdf.setDrawColor(179, 38, 45);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 13;
  pdf.setTextColor(20, 43, 74);
  pdf.setFontSize(14);
  pdf.text("FREE REGISTRATION CONFIRMATION", pageWidth / 2, y, {
    align: "center",
  });

  y += 14;
  const rows: [string, string][] = [
    ["Registration number", d.code],
    ["Participant name", d.name],
    ["Phone number", d.phone],
    ["Email address", d.email],
    ["Church branch", d.branch],
    ["Assembly", d.assembly || "Not provided"],
    ["First choice", d.first],
    ["Second choice", d.second || "Not selected"],
    ["Registration date", d.date],
  ];

  pdf.setFontSize(10);
  for (const [label, value] of rows) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 43, 74);
    pdf.text(`${label}:`, margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(45, 55, 65);
    const wrapped = pdf.splitTextToSize(value || "-", 112);
    pdf.text(wrapped, 68, y);
    y += Math.max(8, wrapped.length * 5 + 2);
  }

  y += 5;
  pdf.setTextColor(25, 115, 55);
  pdf.setFont("helvetica", "bold");
  pdf.text("REGISTRATION STATUS: CONFIRMED", margin, y);

  y += 9;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(45, 55, 65);
  const note =
    "This document confirms that your free registration for MFM Hilltop Media Training 2026 has been received successfully. Please keep this PDF and your registration number for future reference.";
  const noteLines = pdf.splitTextToSize(note, pageWidth - margin * 2);
  pdf.text(noteLines, margin, y);
  y += noteLines.length * 5 + 10;

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 43, 74);
  pdf.text("TRAINING INFORMATION", margin, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(45, 55, 65);

  const trainingInfo = [
    "Dates: 21, 22, 23, 28, 29 and 30 December 2026",
    "Time: 10:00 AM daily",
    "Venue: Church Auditorium, 14 Comrade Sunday Ekuma Street, off Hilltop Road, after SS Field, behind the MTN mast, Abakaliki, Ebonyi State, Nigeria.",
    "Registration fee: FREE",
  ];

  for (const line of trainingInfo) {
    const wrapped = pdf.splitTextToSize(line, pageWidth - margin * 2);
    if (y + wrapped.length * 5 > 275) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 5 + 3;
  }

  pdf.save(`${d.code}-Free-Registration-Confirmation.pdf`);
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
    const formData = new FormData(form);

    const name = String(formData.get("full_name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const branch = String(formData.get("church_branch") || "").trim();
    const assembly = String(formData.get("assembly") || "").trim();
    const first = String(formData.get("first_choice") || "");
    const second = String(formData.get("second_choice") || "");
    const experience = String(formData.get("experience") || "Beginner");

    if (!name || !phone || !email || !branch || !first) {
      setMessage("Please complete all required fields.");
      return;
    }

    setBusy(true);

    try {
      // This RPC matches setup.sql. Do not replace it with a direct table insert:
      // anonymous users are intentionally not granted direct INSERT permission.
      const { data: registrationCode, error } = await supabase.rpc(
        "register_participant",
        {
          p_full_name: name,
          p_phone: phone,
          p_email: email,
          p_church_branch: branch,
          p_assembly: assembly || null,
          p_first_choice: first,
          p_second_choice: second || null,
          p_experience: experience || null,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (typeof registrationCode !== "string" || !registrationCode.trim()) {
        throw new Error(
          "Registration was submitted but no registration number was returned. Please contact the organiser before submitting again."
        );
      }

      const date = new Date().toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setCode(registrationCode);
      setMessage(
        "Registration successful! Your confirmation PDF is downloading."
      );

      makePDF({
        name,
        code: registrationCode,
        phone,
        email,
        branch,
        assembly,
        first,
        second,
        date,
      });

      form.reset();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Registration could not be completed. Please try again."
      );
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
          <p>
            <b>Dates:</b> 21, 22, 23, 28, 29 and 30 December 2026
          </p>
          <p>
            <b>Time:</b> 10:00 AM daily
          </p>
          <p>
            <b>Venue:</b> Church Auditorium, 14 Comrade Sunday Ekuma Street,
            off Hilltop Road, after SS Field, behind the MTN mast, Abakaliki,
            Ebonyi State, Nigeria.
          </p>
          <p>
            <b>Registration fee:</b> FREE
          </p>
          <p>
            <b>Eligibility:</b> MFM members only, including other MFM branches.
          </p>
        </div>

        <form onSubmit={submit}>
          <label>
            Full name *
            <input name="full_name" autoComplete="name" required />
          </label>

          <label>
            Phone number *
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>

          <label>
            Email address *
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Church branch *
            <input name="church_branch" required />
          </label>

          <label>
            Assembly
            <input name="assembly" />
          </label>

          <label>
            First choice category *
            <select name="first_choice" required defaultValue="">
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Second choice category
            <select name="second_choice" defaultValue="">
              <option value="">No second choice</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Previous experience
            <select name="experience" defaultValue="Beginner">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <div className="freeNotice">
            <h2>FREE REGISTRATION</h2>
            <p>No payment is required. Do not make any transfer.</p>
          </div>

          <button type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Complete free registration"}
          </button>
        </form>

        {message && (
          <div className="message" role="status" aria-live="polite">
            <p>{message}</p>
            {code && <strong>Registration number: {code}</strong>}
          </div>
        )}

        <p className="fine">
          Your registration details are used only for MFM Hilltop Media
          Training 2026 administration.
        </p>
      </section>

      <style jsx>{`
        .registrationPage {
          min-height: 100vh;
          padding: 28px 14px;
          background: #f2f5f8;
          color: #243244;
        }
        .card {
          max-width: 760px;
          margin: auto;
          background: #fff;
          padding: 26px;
          border-radius: 14px;
          box-shadow: 0 8px 28px #142b4a18;
        }
        .eyebrow,
        .tagline {
          text-align: center;
          color: #b3262d;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        h1 {
          text-align: center;
          color: #142b4a;
        }
        .details,
        .freeNotice {
          background: #f5f7fa;
          padding: 15px;
          border-radius: 9px;
          margin: 20px 0;
        }
        .freeNotice h2 {
          margin-top: 0;
          color: #142b4a;
        }
        .freeNotice p {
          margin-bottom: 0;
        }
        form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 14px;
          font-weight: 600;
        }
        input,
        select {
          width: 100%;
          min-height: 43px;
          padding: 9px;
          border: 1px solid #ccd4df;
          border-radius: 7px;
          background: white;
          color: #243244;
        }
        .freeNotice,
        button {
          grid-column: 1 / -1;
        }
        button {
          min-height: 48px;
          border: 0;
          border-radius: 8px;
          background: #142b4a;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .message {
          margin-top: 18px;
          padding: 14px;
          background: #edf8ef;
          color: #185b2b;
          border-radius: 8px;
          overflow-wrap: anywhere;
        }
        .fine {
          font-size: 12px;
          color: #667085;
          text-align: center;
          margin-top: 18px;
        }
        @media (max-width: 600px) {
          .card {
            padding: 17px;
          }
          form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
