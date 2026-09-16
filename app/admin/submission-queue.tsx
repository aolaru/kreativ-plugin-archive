'use client';

import { useEffect, useState } from 'react';
import { Check, ClipboardCheck, Inbox, Mail, X } from 'lucide-react';

type Submission = { id: string; developer_name: string; developer_website: string | null; contact_email: string; product_name: string; product_type: string | null; initial_release_year: number | null; official_url: string; description: string | null; source_url: string | null; status: 'pending' | 'approved' | 'rejected'; review_note: string | null; created_at: string; reviewed_at: string | null };

export function SubmissionQueue({ token, onReviewed }: { token: string; onReviewed: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<'pending' | 'reviewed'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  async function load(nextView = view) {
    const response = await fetch(`/api/admin/submissions?view=${nextView}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? 'Unable to load submissions.'); return; }
    setSubmissions(data.submissions ?? []);
  }
  useEffect(() => { load(view); }, [token, view]);

  async function review(submissionId: string, decision: 'approved' | 'rejected') {
    setBusy(submissionId); setError(null); setNotice(null);
    const response = await fetch('/api/admin/submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ submissionId, decision, reviewNote: notes[submissionId] ?? '' }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? 'Unable to complete this review.');
    else { setSubmissions((items) => items.filter((item) => item.id !== submissionId)); setNotice(data.message); onReviewed(); }
    setBusy(null);
  }

  return <section className="submission-queue"><div className="queue-heading"><div><p className="eyebrow">Contributor intake</p><h2>{view === 'pending' ? 'Pending submissions' : 'Review history'}</h2></div>{view === 'pending' ? <Inbox size={19}/> : <ClipboardCheck size={19}/>}</div><div className="queue-tabs" role="tablist" aria-label="Submission status"><button className={view === 'pending' ? 'active' : ''} onClick={() => setView('pending')} role="tab" aria-selected={view === 'pending'}>Awaiting review</button><button className={view === 'reviewed' ? 'active' : ''} onClick={() => setView('reviewed')} role="tab" aria-selected={view === 'reviewed'}>Reviewed</button></div>{notice && <p className="queue-notice">{notice}</p>}{error && <p className="queue-error">{error}</p>}{submissions.length ? submissions.map((submission) => <article key={submission.id}><div><b>{submission.product_name}</b><span>{submission.developer_name}{submission.initial_release_year ? ` · ${submission.initial_release_year}` : ''}{submission.product_type ? ` · ${submission.product_type}` : ''}</span></div><p>{submission.description || 'No description supplied.'}</p><div className="queue-links"><a href={submission.official_url} target="_blank" rel="noreferrer">Official page ↗</a>{submission.source_url && <a href={submission.source_url} target="_blank" rel="noreferrer">Supporting source ↗</a>}{submission.developer_website && <a href={submission.developer_website} target="_blank" rel="noreferrer">Developer website ↗</a>}<a href={`mailto:${submission.contact_email}`}><Mail size={13}/> {submission.contact_email}</a></div>{view === 'pending' ? <><label className="queue-note">Editorial note <span>Required for rejection</span><textarea value={notes[submission.id] ?? ''} onChange={(event) => setNotes({ ...notes, [submission.id]: event.target.value })} rows={3} maxLength={2000} placeholder="Optional approval note, or explain what needs to change." /></label><div className="queue-actions"><button onClick={() => review(submission.id, 'approved')} disabled={busy === submission.id}><Check size={14}/> {busy === submission.id ? 'Saving…' : 'Approve & publish'}</button><button onClick={() => review(submission.id, 'rejected')} disabled={busy === submission.id}><X size={14}/> Reject with note</button></div></> : <div className={`review-outcome ${submission.status}`}><b>{submission.status === 'approved' ? 'Approved & published' : 'Rejected'}</b>{submission.review_note && <p>{submission.review_note}</p>}<span>{submission.reviewed_at ? `Reviewed ${new Date(submission.reviewed_at).toLocaleDateString()}` : 'Reviewed'}</span></div>}</article>) : <p className="queue-empty">{view === 'pending' ? 'Nothing is waiting for review.' : 'No reviewed submissions yet.'}</p>}</section>;
}
