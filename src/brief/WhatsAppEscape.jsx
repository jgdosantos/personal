import React from 'react';
import { MessageCircle, Check } from 'lucide-react';
import { whatsappLink } from '../lib/whatsapp.js';
import { useBrief } from './context.js';
import { escape as copy, whatsappMessage } from './content.js';
import { focusRing } from './TextFields.jsx';

/**
 * A saída de emergência de um campo de material.
 *
 * Cliente travado num campo é formulário abandonado — e num briefing de marca
 * é normal não ter o brandbook à mão, ou preferir mandar o arquivo do jeito que
 * já manda tudo. Esta é a porta.
 *
 * Marcar NÃO fecha o upload: o cliente pode marcar hoje e subir amanhã.
 */
export const WhatsAppEscape = ({ field, label }) => {
  const { brief, toggleWhatsapp, readOnly } = useBrief();
  const marked = (brief.whatsappFields || []).includes(field);

  if (readOnly && !marked) return null;

  const open = () => {
    // Ordem importa: gravar ANTES de abrir a aba. Abrir primeiro tira o cliente
    // da página e o PATCH pode nunca sair — aí o campo fica eternamente
    // "pendente" para o João, que vai cobrar material já recebido.
    toggleWhatsapp(field);
    const message = whatsappMessage(label, brief.brandName);
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
  };

  if (marked) {
    return (
      <div className="mt-3 rounded-2xl bg-neutral-900/[0.035] p-4 ring-1 ring-inset ring-black/[0.05]">
        <p className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
          <Check size={15} strokeWidth={2.4} className="flex-shrink-0" />
          {copy.marked(label)}
        </p>
        <p className="mt-1 pl-[23px] text-[12.5px] text-neutral-500">{copy.stillOpen}</p>
        {!readOnly && (
          <button
            type="button"
            onClick={() => toggleWhatsapp(field)}
            className={`mt-2 ml-[23px] rounded-sm text-[12.5px] text-neutral-500 underline underline-offset-2 transition-colors hover:text-neutral-900 ${focusRing}`}
          >
            {copy.undo}
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`mt-3 inline-flex items-center gap-2 rounded-full px-1 py-1 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900 ${focusRing}`}
    >
      <MessageCircle size={15} strokeWidth={1.9} />
      {copy.offer}
    </button>
  );
};
