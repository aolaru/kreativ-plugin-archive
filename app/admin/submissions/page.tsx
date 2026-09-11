'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SubmissionQueue } from '../submission-queue';

export default function SubmissionReviewPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(window.localStorage.getItem('pluginpedia_admin_token')); }, []);

  if (!token) return <main className="admin-shell"><header className="admin-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>archive</small></a><a href="/admin">Editor sign-in <ArrowRight size={15}/></a></header><section className="admin-login"><p className="eyebrow">Contributor intake</p><h1>Sign in first</h1><p>Use the archive editor to sign in, then return here to review developer submissions.</p><a className="admin-primary" href="/admin">Open editor <ArrowRight size={16}/></a></section></main>;

  return <main className="admin-shell"><header className="admin-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>editor</small></a><a href="/admin">Return to editor <ArrowRight size={15}/></a></header><section className="review-page"><div><p className="eyebrow">Contributor intake</p><h1>Plugin submissions</h1><p>Approve records only after checking the developer’s official information and supporting source material.</p></div><SubmissionQueue token={token} onReviewed={() => undefined} /></section></main>;
}
