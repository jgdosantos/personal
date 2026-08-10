import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { FIELDS, UPLOAD_FIELDS, fieldState } from '../../shared/briefFields.js';
import { useBrief } from './context.js';
import { submit as copy, fields as fieldCopy } from './content.js';
import { focusRing } from './TextFields.jsx';

const primaryButton =
  'inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out hover:bg-neutral-700 active:scale-[0.97] disabled:opacity-35 disabled:hover:bg-neutral-900';

/** Resumo do que vai. Pendente aparece apagado, não escondido — o cliente
 *  decide enviar sabendo o que falta, em vez de descobrir depois. */
const Summary = () => {
  const { brief, files } = useBrief();

  const rows = [
    ...UPLOAD_FIELDS.map((field) => {
      const state = fieldState(field, files, brief.whatsappFields);
      const count = files.filter((f) => f.field === field && f.status === 'ready').length;
      return {
        label: FIELDS[field].label,
        value: state === 'recebido'
          ? `${count} arquivo${count === 1 ? '' : 's'}`
          : copy.stateLabel[state],
        pending: state === 'nao_enviado',
      };
    }),
    {
      label: fieldCopy.designSystem.label,
      value: brief.designSystemUrl
        ? 'link enviado'
        : copy.stateLabel[fieldState('design_system', [], brief.whatsappFields)],
      pending: !brief.designSystemUrl
        && !(brief.whatsappFields || []).includes('design_system'),
    },
  ];

  return (
    <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-3 border-b border-black/[0.06] pb-2">
          <dt className="text-[13px] text-neutral-600">{r.label}</dt>
          <dd className={`text-[13px] tabular-nums ${r.pending ? 'text-neutral-400' : 'text-neutral-900'}`}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export const Submit = () => {
  const { token, brief, reload, flush } = useBrief();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const call = async (action) => {
    setBusy(true);
    setError('');
    try {
      // Garante que a última digitação subiu antes de fechar o briefing —
      // sem isto o debounce de 1,2s pode engolir a frase final.
      await flush();
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, c: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await reload();
    } catch (err) {
      setError(err.message || 'Não consegui enviar. Tenta de novo.');
    } finally {
      setBusy(false);
    }
  };

  if (brief.status === 'submitted') {
    return (
      <section className="mt-12 rounded-2xl bg-neutral-900/[0.035] p-6 ring-1 ring-inset ring-black/[0.05]">
        <span className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-400">
          <Check size={14} strokeWidth={2.4} />
          {copy.doneKicker}
        </span>
        <h2 className="mt-3 text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">
          {copy.doneHeading}
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-neutral-500">{copy.doneBody}</p>
        <Summary />
        {error && <p role="alert" className="mt-4 text-[12.5px] font-medium text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => call('reopen')}
          disabled={busy}
          className={`mt-6 inline-flex h-10 items-center rounded-full bg-neutral-900/[0.06] px-4 text-[13px] font-medium text-neutral-600 transition-colors duration-200 hover:bg-neutral-900/[0.1] disabled:opacity-40 ${focusRing}`}
        >
          {busy ? copy.reopening : copy.reopen}
        </button>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-black/[0.06] pt-8">
      <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">{copy.heading}</h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-neutral-500">{copy.partial}</p>
      <Summary />
      {error && <p role="alert" className="mt-4 text-[12.5px] font-medium text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => call('submit')}
        disabled={busy}
        className={`mt-6 ${primaryButton} ${focusRing}`}
      >
        {busy ? copy.sending : copy.action}
      </button>
    </section>
  );
};
