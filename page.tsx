"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  registration_code: string;
  full_name: string;
  phone: string;
  email: string;
  church_branch: string;
  assembly: string | null;
  first_choice: string;
  second_choice: string | null;
  experience: string | null;
  registration_status: string;
  created_at: string;
};

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else setSession(data.session);
  }

  async function load() {
    const { data, error } = await supabase
      .from("registrations")
      .select("id,registration_code,full_name,phone,email,church_branch,assembly,first_choice,second_choice,experience,registration_status,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setRows((data || []) as Row[]);
  }

  useEffect(() => {
    if (session) load();
  }, [session]);

  async function updateStatus(row: Row, value: string) {
    const { error } = await supabase
      .from("registrations")
      .update({ registration_status: value })
      .eq("id", row.id);

    if (error) setError(error.message);
    else load();
  }

  const visible = rows.filter(
    r => filter === "all" || r.registration_status === filter
  );

  if (!session) {
    return (
      <main className="adminWrap">
        <div className="adminCard">
          <p className="eyebrow red">MFM HILLTOP MEDIA TRAINING</p>
          <h1>Admin sign in</h1>
          <p>Authorised organisers only.</p>
          <form onSubmit={login}>
            <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
            <button className="submit">Sign in</button>
            {error && <p className="error">{error}</p>}
          </form>
          <a href="/">← Back to registration</a>
        </div>
      </main>
    );
  }

  function exportCSV() {
    const csv = [
      ["Registration No", "Name", "Phone", "Email", "Branch", "Assembly", "First choice", "Second choice", "Experience", "Registration status"],
      ...visible.map(r => [
        r.registration_code, r.full_name, r.phone, r.email, r.church_branch,
        r.assembly || "", r.first_choice, r.second_choice || "", r.experience || "",
        r.registration_status,
      ]),
    ].map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfm-media-training-participants.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="dashboard">
      <header className="dashHead">
        <div>
          <p className="eyebrow">MFM HILLTOP ZONAL HEADQUARTERS</p>
          <h1>Registration dashboard</h1>
        </div>
        <button className="signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>

      <div className="stats">
        <div><small>Total registrations</small><b>{rows.length}</b></div>
        <div><small>Confirmed registrations</small><b>{rows.filter(r => r.registration_status === "approved").length}</b></div>
        <div><small>Pending registrations</small><b>{rows.filter(r => r.registration_status === "pending").length}</b></div>
      </div>

      <div className="tableTop">
        <h2>Participants</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All registrations</option>
          <option value="approved">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={load}>Refresh</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              <th>Reg. no.</th>
              <th>Participant</th>
              <th>Branch</th>
              <th>Category</th>
              <th>Registration</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.id}>
                <td><b>{r.registration_code || "Pending code"}</b><small>{new Date(r.created_at).toLocaleDateString()}</small></td>
                <td>{r.full_name}<small>{r.phone}<br />{r.email}</small></td>
                <td>{r.church_branch}<small>{r.assembly || ""}</small></td>
                <td>{r.first_choice}<small>2nd: {r.second_choice || "—"}</small></td>
                <td>
                  <select value={r.registration_status} onChange={e => updateStatus(r, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="approved">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="adminNote">Registration is free. Use this dashboard to review participant details and manage registration status.</p>
    </main>
  );
}
