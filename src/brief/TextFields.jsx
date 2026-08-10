import React, { useState } from 'react';
import { useBrief } from './context.js';
import { fields } from './content.js';
import { WhatsAppEscape } from './WhatsAppEscape.jsx';

const DESCRIPTION_SOFT_MAX = 600;

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const inputClass =
  'w-full rounded-2xl border border-black/[0.07] bg-neutral-100/60 px-3.5 py-3 text-[14px] leading-[1.55] text-neutral-900 placeholder:text-neutral-400 transition-colors duration-200 focus:border-black/10 focus:bg-white disabled:opacity-60';

const Label = ({ htmlFor, children, optional }) => (
  <label htmlFor={htmlFor} className="flex items-baseline gap-2">
    <span className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">{children}</span>
    {optional && <span className="text-[12px] text-neutral-400">opcional</span>}
  </label>
);

const Help = ({ children }) => (
  <p className="mt-1.5 text-[13px] leading-[1.55] text-neutral-500">{children}</p>
);

const Field = ({ id, label, help, optional, children }) => (
  <div>
    <Label htmlFor={id} optional={optional}>{label}</Label>
    {help && <Help>{help}</Help>}
    <div className="mt-3">{children}</div>
  </div>
);

export const TextFields = () => {
  const { brief, setField, readOnly } = useBrief();
  const [urlError, setUrlError] = useState('');

  const over = (brief.description || '').length > DESCRIPTION_SOFT_MAX;

  const checkUrl = (value) => {
    if (!value) { setUrlError(''); return; }
    try {
      const { protocol } = new URL(value);
      setUrlError(protocol === 'http:' || protocol === 'https:' ? '' : fields.designSystem.invalid);
    } catch {
      setUrlError(fields.designSystem.invalid);
    }
  };

  return (
    <div className="flex flex-col gap-9">
      <Field id="brandName" label={fields.brandName.label} help={fields.brandName.help}>
        <input
          id="brandName"
          value={brief.brandName}
          onChange={(e) => setField('brandName', e.target.value)}
          placeholder={fields.brandName.placeholder}
          maxLength={120}
          disabled={readOnly}
          className={`${inputClass} ${focusRing}`}
        />
      </Field>

      <Field id="instagram" label={fields.instagram.label} help={fields.instagram.help} optional>
        {/* O @ é decoração: fica fora do valor para o cliente não apagá-lo sem
            querer nem digitá-lo duas vezes. A normalização de verdade — URL
            colada virando @handle — acontece no servidor. */}
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400"
          >
            @
          </span>
          <input
            id="instagram"
            value={(brief.instagram || '').replace(/^@/, '')}
            onChange={(e) => setField('instagram', e.target.value)}
            placeholder={fields.instagram.placeholder}
            maxLength={80}
            disabled={readOnly}
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            className={`${inputClass} ${focusRing} pl-8`}
          />
        </div>
      </Field>

      <Field id="description" label={fields.description.label} help={fields.description.help}>
        <textarea
          id="description"
          rows={5}
          value={brief.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder={fields.description.placeholder}
          maxLength={1200}
          disabled={readOnly}
          className={`${inputClass} ${focusRing} resize-none`}
        />
        <p className={`mt-1.5 text-right text-[12px] tabular-nums ${over ? 'text-red-600' : 'text-neutral-400'}`}>
          {(brief.description || '').length}/{DESCRIPTION_SOFT_MAX}
        </p>
      </Field>

      <Field id="designSystemUrl" label={fields.designSystem.label} help={fields.designSystem.help} optional>
        <input
          id="designSystemUrl"
          type="url"
          inputMode="url"
          value={brief.designSystemUrl}
          onChange={(e) => { setField('designSystemUrl', e.target.value); if (urlError) checkUrl(e.target.value); }}
          onBlur={(e) => checkUrl(e.target.value)}
          placeholder={fields.designSystem.placeholder}
          maxLength={500}
          disabled={readOnly}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          aria-invalid={Boolean(urlError)}
          className={`${inputClass} ${focusRing}`}
        />
        {urlError && (
          <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-600">{urlError}</p>
        )}
        {/* Design System é campo de texto, mas entra na lista de escapatória:
            o cliente pode não saber onde está o Figma e preferir perguntar. */}
        <WhatsAppEscape field="design_system" label={fields.designSystem.label} />
      </Field>

      <Field id="notes" label={fields.notes.label} help={fields.notes.help} optional>
        <textarea
          id="notes"
          rows={4}
          value={brief.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder={fields.notes.placeholder}
          maxLength={1200}
          disabled={readOnly}
          className={`${inputClass} ${focusRing} resize-none`}
        />
      </Field>
    </div>
  );
};
