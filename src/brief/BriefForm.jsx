import React, { useEffect, useState } from 'react';
import { whatsappLink } from '../lib/whatsapp.js';
import { page, states, invalidLinkMessage } from './content.js';
import { readClientToken } from './token.js';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const Shell = ({ children }) => (
  <div className="brief-page min-h-screen bg-white">
    <div className="relative overflow-hidden border-b border-black/[0.06] pb-12 pt-16 md:pb-16 md:pt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-right leading-none"
      >
        <span className="block text-[30vw] font-black tracking-tighter text-black opacity-[0.05]">
          JG
        </span>
      </div>
      <header className="relative z-10 mx-auto w-full max-w-3xl px-6 md:px-8">
        <span className="block text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          {page.kicker}
        </span>
        <h1
          className="mt-4 font-medium leading-[1.02] tracking-tighter text-neutral-900"
          style={{ fontSize: 'clamp(2rem, 5vw, 56px)', marginLeft: '-0.03em' }}
        >
          {page.heading}
        </h1>
      </header>
    </div>
    <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-10 md:px-8 md:pt-14">
      {children}
    </main>
  </div>
);

const Message = ({ title, body, cta, href }) => (
  <div className="rounded-2xl bg-neutral-900/[0.035] p-6 ring-1 ring-inset ring-black/[0.05]">
    <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">{title}</h2>
    <p className="mt-2 text-[14px] leading-[1.6] text-neutral-500">{body}</p>
    {cta && (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-5 inline-flex h-10 items-center rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition-all duration-200 ease-out hover:bg-neutral-700 active:scale-[0.97] ${focusRing}`}
      >
        {cta}
      </a>
    )}
  </div>
);

const BriefForm = () => {
  const [token] = useState(readClientToken);
  const [status, setStatus] = useState(token ? 'loading' : 'invalid');

  useEffect(() => {
    document.title = page.title;
    // Cinto e suspensório: a regra do vercel.json não roda em preview local
    // nem em ambiente de desenvolvimento, e um briefing de cliente indexado é
    // exatamente o tipo de coisa que não dá para desfazer.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/brief?c=${encodeURIComponent(token)}`);
        if (!alive) return;
        if (res.status === 404) { setStatus('invalid'); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await res.json();
        setStatus('ready');
      } catch {
        if (alive) setStatus('error');
      }
    })();
    return () => { alive = false; };
  }, [token]);

  if (status === 'loading') {
    return <Shell><p className="text-[14px] text-neutral-500">{states.loading}</p></Shell>;
  }

  if (status === 'invalid') {
    return (
      <Shell>
        <Message
          title={states.invalidTitle}
          body={states.invalidBody}
          cta={states.invalidCta}
          href={whatsappLink(invalidLinkMessage)}
        />
      </Shell>
    );
  }

  if (status === 'error') {
    return <Shell><Message title={states.errorTitle} body={states.errorBody} /></Shell>;
  }

  return (
    <Shell>
      <p className="text-[15px] leading-[1.65] text-neutral-600">{page.intro}</p>
      <p className="mt-8 text-[13px] text-neutral-400">{page.autosave}</p>
    </Shell>
  );
};

export default BriefForm;
