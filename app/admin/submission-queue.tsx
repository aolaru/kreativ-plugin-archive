'use client';

import { useEffect, useState } from 'react';
import { Check, Inbox, X } from 'lucide-react';

type Submission = { id: string; developer_name: string; product_name: string; product_type: string | null; initial_release_year: number | null; official_url: string; description: string | null; source_url: string | null };

export function SubmissionQueue({ token, onReviewed }: { token: string; onReviewed: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const response = await fetch('/api/admin/submissions', { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? 'Unable to load submissions.'); return; }
    setSubmissions(data.submissions ?? []);
  }
  useEffect(() => { load(); }, [token]);

  async function review(submissionId: string, decision: 'accepted' | 'rejected') {
    setBusy(submissionId); setError(null);
    const response = await fetch('/api/admin/submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ submissionId, decision }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? 'Unable to complete this review.');
    else { setSubmissions((items) => items.filter((item) => item.id !== submissionId)); onReviewed(); }
    setBusy(null);
  }

  return <section className="submission-queue"><div className="queue-heading"><div><p className="eyebrow">Contributor intake</p><h2>Pending submissions</h2></div><Inbox size={19}/></div>{error && <p className="queue-error">{error}</p>}{submissions.length ? submissions.map((submission) => <article key={submission.id}><div><b>{submission.product_name}</b><span>{submission.developer_name}{submission.initial_release_year ? ` · ${submission.initial_release_year}` : ''}</span></div><p>{submission.description || 'No description supplied.'}</p><a href={submission.official_url} target="_blank" rel="noreferrer">Official page ↗</a>{submission.source_url && <a href={submission.source_url} target="_blank" rel="noreferrer">Supporting source ↗</a>}<div className="queue-actions"><button onClick={() => review(submission.id, 'accepted')} disabled={busy === submission.id}><Check size={14}/> Approve</button><button onClick={() => review(submission.id, 'rejected')} disabled={busy === submission.id}><X size={14}/> Reject</button></div></article>) : <p className="queue-empty">Nothing is waiting for review.</p>}</section>;
}
