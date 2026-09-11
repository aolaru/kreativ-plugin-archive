'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const blank = { developerName: '', developerWebsite: '', contactEmail: '', productName: '', productType: '', initialReleaseYear: '', officialUrl: '', description: '', sourceUrl: '', company: '' };

export default function SubmitPage() {
  const [form, setForm] = useState(blank);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus(null);
    try {
      const response = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to send your submission.');
      setStatus({ type: 'success', message: data.message }); setForm(blank);
    } catch (error) { setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to send your submission.' }); } finally { setBusy(false); }
  }

  return <main className="submit-page"><header className="record-header"><a className="wordmark" href="/"><span className="mark">P</span><span>pluginpedia</span><small>archive</small></a><nav><a href="/">Archive</a><a href="/status/discontinued">Discontinued</a><a href="/admin">Editor access</a></nav></header><section className="submit-hero"><p className="eyebrow">Developer submissions</p><h1>Put your plugin<br/><em>on the record.</em></h1><p>Submit an official product page and the core facts. Every submission is reviewed before appearing in Pluginpedia.</p></section><section className="submit-layout"><form className="submission-form" onSubmit={submit}><div className="form-heading"><div><p className="eyebrow">Submission details</p><h2>Tell us about your plugin</h2></div><span>Required fields marked *</span></div><div className="submission-grid"><label>Developer or company *<input value={form.developerName} onChange={(event) => setForm({ ...form, developerName: event.target.value })} required placeholder="Your developer name" /></label><label>Contact email *<input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} required placeholder="you@company.com" /></label><label>Developer website<input type="url" value={form.developerWebsite} onChange={(event) => setForm({ ...form, developerWebsite: event.target.value })} placeholder="https://…" /></label><label>Plugin name *<input value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} required placeholder="Your plugin" /></label><label>Plugin type<input value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })} placeholder="Synthesizer, reverb, utility…" /></label><label>Initial release year<input type="number" min="1950" max="2100" value={form.initialReleaseYear} onChange={(event) => setForm({ ...form, initialReleaseYear: event.target.value })} placeholder="2026" /></label><label className="full">Official product page *<input type="url" value={form.officialUrl} onChange={(event) => setForm({ ...form, officialUrl: event.target.value })} required placeholder="https://…" /></label><label className="full">Product description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} placeholder="What does it do? Include the essential facts you would like reviewed." /></label><label className="full">Supporting source or documentation<input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="Optional: release notes, manual, or announcement" /></label><input className="bot-trap" tabIndex={-1} autoComplete="off" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} aria-hidden="true" /></div>{status && <p className={`submission-status ${status.type}`}>{status.type === 'success' && <CheckCircle2 size={18}/>} {status.message}</p>}<button className="submit-button" disabled={busy}>{busy ? 'Sending submission…' : 'Send for editorial review'} <ArrowRight size={16}/></button></form><aside className="submission-notes"><p className="eyebrow">What happens next</p><ol><li>We check the product page and source material.</li><li>We may contact you if a key fact needs clarification.</li><li>Approved entries are added to the public archive.</li></ol><p>Pluginpedia records software history. Product listings are editorial, not paid placements.</p></aside></section></main>;
}
