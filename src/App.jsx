import React, { useEffect } from 'react';
import { Github, Linkedin, Twitter, Mail, BookOpen, Code, Palette, Coffee, Heart, Lightbulb, ChevronLeft, ChevronRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { AnimatedSection } from './lib/animation.jsx';
import { whatsappLink } from './lib/whatsapp.js';

// `three` pesa mais que todo o resto do bundle somado, e o efeito é
// decorativo — carregar sob demanda deixa o nome do hero pintar primeiro.
const LiquidEther = React.lazy(() => import('./components/LiquidEther.jsx'));

// Precisa ser constante de módulo: `colors` entra no array de dependências do
// efeito do componente, e um literal novo a cada render derrubaria e recriaria
// o contexto WebGL inteiro — o App re-renderiza a cada evento de scroll.
const HERO_FLUID_COLORS = ['#EDEDED', '#C8C8C8', '#9A9A9A'];

// ============================================
// HELPERS
// ============================================
const renderRichText = (text) => {
  if (!text) return '';

  // Split by link syntax [text](url), bold-italic (***), then bold (**)
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*\*.*?\*\*\*|\*\*.*?\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) {
      return <strong key={i} className="italic font-bold">{part.slice(3, -3)}</strong>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="timeline-link font-bold"
          >
            {match[1]}
          </a>
        );
      }
    }
    return part;
  });
};

// ============================================
// TRANSLATIONS / TRADUÇÕES
// ============================================
const translations = {
  PT: {
    hero: {
      greeting: 'Olá eu sou...'
    },
    about: {
      bio: 'Natural de **Belo Horizonte** (MG) e nascido em 2006, sou uma pessoa movida por curiosidade, **aprendizado contínuo** e pela vontade de entender como **tecnologia, estratégia e pessoas** podem gerar **impacto real**. Desde cedo, desenvolvi um interesse genuíno por temas que unem **inovação, performance e liderança**. Foi assim que me aproximei de três áreas que hoje fazem parte do meu foco: ***Inteligência Artificial, Growth Marketing e o mercado Cripto.***'
    },
    nav: {
      about: 'Sobre',
      projects: 'Projetos',
      work: 'Trabalho',
      contact: 'Contato'
    },
    work: {
      title: 'Projetos & Cases',
      hint: 'Arraste para o lado',
      visit: 'Visitar site',
      prev: 'Projeto anterior',
      next: 'Próximo projeto',
      roles: {
        fba: 'Marca & Presença Digital',
        bkdg: 'Produto & UX',
        eduardobraz: 'Site Pessoal',
        sniffer: 'PMO'
      }
    },
    timeline: {
      title: 'Jornada Profissional',
      events: [
        {
          year: "Fev 2012 – Fev 2021",
          title: "Formação Ensino Fundamental I e II",
          description: "Colégio Sagrado Coração de Maria (BH). Atleta da equipe de futsal e representante esportivo."
        },

        {
          year: "Fev 2022 – Dez 2024",
          title: "Escola do Sebrae - Médio e Tecnico em Marketing",
          description: "Formação técnica em empreendedorismo e marketing."
        },
        {
          year: "Jun 2024",
          title: "Missão Internacional - Barcelona",
          description: "Participação na [missão internacional em Barcelona](https://mg.agenciasebrae.com.br/cultura-empreendedora/estudantes-da-escola-do-sebrae-participam-de-missao-internacional-em-barcelona/)."
        },
        {
          year: "Jan 2024 – Jul 2024",
          title: "Estágio em Dados",
          description: "Dados na UINE (Unidade de Inteligência Estratégica), onde contribuí para construção do [Portal Inteligência Sebrae](https://inteligencia.sebraemg.com.br/isdel)."
        },
        {
          year: "Ago 2024 – Dez 2024",
          title: "Estágio em Growth Marketing",
          description: "[Be Honest Brasil](https://behonestbrasil.com.br/). Gestão de tráfego pago e otimização de Landing Pages."
        },
        {
          year: "2024 - Janeiro 2026",
          title: "Head de Growth Marketing",
          description: "Focado em performance e canais de aquisição na [Be Honest Brasil](https://behonestbrasil.com.br/), onde graças ao trabalho da equipe conseguimos \"dobrar de tamanho\" em 1 ano."
        },
        {
          year: "Fev 2026 – Mar 2026",
          title: "Proxxy's Group - Time de Relacionamento",
          description: "Atuei no time de relacionamento da [Proxxy's Group](https://proxxytech.com.br/)."
        },
        {
          year: "Mar 2026 – Atualmente",
          title: "Sniffer - PMO",
          description: "PMO na Sniffer, em Belo Horizonte."
        },
        {
          year: "Jul 2026 – Atualmente",
          title: "BKDG - Produto & UX",
          description: "Produto e UX na BKDG, em Belo Horizonte."
        }
      ]
    },
    toolkit: {
      title: "Ferramentas & Stack",
      items: [
        { title: "Growth Marketing", subtitle: "Estratégia e Performance" },
        { title: "IA & Automação", subtitle: "Inteligência e Processos" },
        { title: "Funil de Vendas", subtitle: "Processos e Conversão" }
      ]
    },
    contact: {
      title: "Vamos construir algo juntos?",
      subtitle: "Conta o que você precisa e eu respondo no WhatsApp.",
      name: "Seu nome",
      namePlaceholder: "Como você se chama?",
      topic: "O que você quer fazer?",
      topicPlaceholder: "Selecione uma opção",
      topics: [
        "Site institucional",
        "Landing page de campanha",
        "Redesign de site existente",
        "Loja / e-commerce",
        "Outro"
      ],
      message: "Sua mensagem",
      messagePlaceholder: "Conte um pouco sobre o projeto...",
      submit: "Enviar no WhatsApp",
      // O formulário não envia nada sozinho — ele abre o WhatsApp com o texto
      // pronto. Dizer isso evita que a pessoa feche a aba achando que enviou.
      note: "Abre o WhatsApp com a mensagem pronta. Você confere antes de enviar.",
      waIntro: "Olá, João! Aqui é",
      waTopic: "O que eu quero fazer:",
      waSource: "Enviado pelo site joaogsantos.com"
    },

    footer: "João Gabriel dos Santos. Made with curiosity and AI."
  },
  EN: {
    hero: {
      greeting: 'Hello, I am...'
    },
    about: {
      bio: "Born in **Belo Horizonte** (MG) in 2006, I'm a person driven by curiosity, **continuous learning**, and the desire to understand how **technology, strategy, and people** can create **real impact**. From an early age, I developed a genuine interest in topics that combine **innovation, performance, and leadership**. That's how I got closer to three areas that are now part of my focus: ***Artificial Intelligence, Growth Marketing, and the Crypto market.***"
    },
    nav: {
      about: 'About',
      projects: 'Projects',
      work: 'Work',
      contact: 'Contact'
    },
    work: {
      title: 'Projects & Cases',
      hint: 'Drag to browse',
      visit: 'Visit site',
      prev: 'Previous project',
      next: 'Next project',
      roles: {
        fba: 'Brand & Digital Presence',
        bkdg: 'Product & UX',
        eduardobraz: 'Personal Site',
        sniffer: 'PMO'
      }
    },
    timeline: {
      title: 'Professional Journey',
      events: [
        {
          year: "Feb 2012 – Feb 2021",
          title: "Elementary & Middle School Education",
          description: "Colégio Sagrado Coração de Maria (BH). Futsal team athlete and sports representative."
        },

        {
          year: "Feb 2022 – Dec 2024",
          title: "Sebrae School - High School & Marketing Technician",
          description: "Technical training in entrepreneurship and marketing."
        },
        {
          year: "Jun 2024",
          title: "International Mission - Barcelona",
          description: "Participation in the [international mission in Barcelona](https://mg.agenciasebrae.com.br/cultura-empreendedora/estudantes-da-escola-do-sebrae-participam-de-missao-internacional-em-barcelona/)."
        },
        {
          year: "Jan 2024 – Jul 2024",
          title: "Data Internship",
          description: "Data at UINE (Strategic Intelligence Unit), where I contributed to the development of the [Sebrae Intelligence Portal](https://inteligencia.sebraemg.com.br/isdel)."
        },
        {
          year: "Aug 2024 – Dec 2024",
          title: "Growth Marketing Internship",
          description: "[Be Honest Brasil](https://behonestbrasil.com.br/). Paid traffic management and Landing Page optimization."
        },
        {
          year: "2024 - January 2026",
          title: "Head of Growth Marketing",
          description: "Focused on performance and acquisition channels at [Be Honest Brasil](https://behonestbrasil.com.br/), where thanks to the team's work we managed to \"double in size\" in 1 year."
        },
        {
          year: "Feb 2026 – Mar 2026",
          title: "Proxxy's Group - Relationship Team",
          description: "Worked in the relationship team at [Proxxy's Group](https://proxxytech.com.br/)."
        },
        {
          year: "Mar 2026 – Currently",
          title: "Sniffer - PMO",
          description: "PMO at Sniffer, in Belo Horizonte."
        },
        {
          year: "Jul 2026 – Currently",
          title: "BKDG - Product & UX",
          description: "Product and UX at BKDG, in Belo Horizonte."
        }
      ]
    },
    toolkit: {
      title: "Toolkit & Stack",
      items: [
        { title: "Growth Marketing", subtitle: "Strategy & Performance" },
        { title: "AI & Automation", subtitle: "Intelligence & Processes" },
        { title: "Sales Funnel", subtitle: "Processes & Conversion" }
      ]
    },
    contact: {
      title: "Let's build something together?",
      subtitle: "Tell me what you need and I'll reply on WhatsApp.",
      name: "Your name",
      namePlaceholder: "What should I call you?",
      topic: "What do you want to do?",
      topicPlaceholder: "Select an option",
      topics: [
        "Company website",
        "Campaign landing page",
        "Redesign of an existing site",
        "Online store / e-commerce",
        "Something else"
      ],
      message: "Your message",
      messagePlaceholder: "Tell me a bit about the project...",
      submit: "Send on WhatsApp",
      note: "Opens WhatsApp with the message ready. You review it before sending.",
      waIntro: "Hi, João! This is",
      waTopic: "What I want to do:",
      waSource: "Sent from joaogsantos.com"
    },

    footer: "João Gabriel dos Santos. Made with curiosity and AI."
  }
};

// Static data (não muda com idioma)
const staticData = {
  name: "João Gabriel dos Santos",
  social: [
    { icon: Github, label: "GitHub", url: "https://github.com/joaogabriel", color: "hover:text-white" },
    { icon: Linkedin, label: "LinkedIn", url: "https://linkedin.com/in/joaogabriel", color: "hover:text-blue-400" },
    { icon: Twitter, label: "Twitter", url: "https://twitter.com/joaogabriel", color: "hover:text-blue-300" },
    { icon: Mail, label: "Email", url: "mailto:joao@example.com", color: "hover:text-red-400" },
  ],
  eventIcons: [Code, Lightbulb, BookOpen, Heart],
  eventColors: ["bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-red-500"],
  // Previews are hero screenshots captured at 1440x900 (16:10) — the same
  // aspect ratio the mockup viewport uses, so nothing gets cropped.
  projects: [
    { slug: "fba", name: "fba.", domain: "fba.center", url: "https://fba.center", image: "cases/fba.jpg" },
    { slug: "bkdg", name: "BKDG", domain: "bkdg.co", url: "https://bkdg.co", image: "cases/bkdg.jpg" },
    { slug: "eduardobraz", name: "Eduardo Braz", domain: "eduardobraz.com", url: "https://eduardobraz.com", image: "cases/eduardobraz.jpg" },
    { slug: "sniffer", name: "Sniffer", domain: "sniffer.network", url: "https://sniffer.network", image: "cases/sniffer.jpg" }
  ]
};

// ============================================
// COMPONENTES
// ============================================

// Um fundo animado em tela cheia é exatamente o que "reduzir movimento" pede
// para desligar, então respeitamos a preferência do sistema.
const usePrefersReducedMotion = () => {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

// Desktop window chrome wrapping a static screenshot of the live site.
const BrowserMockup = ({ domain, image, alt }) => (
  <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.08] shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] transition-shadow duration-500 group-hover:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.55)]">
    {/* Title bar */}
    <div className="h-9 md:h-11 flex items-center gap-4 px-4 bg-[#f5f5f7] border-b border-black/[0.06]">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
      </div>
      <div className="flex-1 flex justify-center min-w-0">
        <span className="px-3 py-1 rounded-md bg-black/[0.05] text-gray-500 text-[10px] md:text-[11px] tracking-tight truncate max-w-full">
          {domain}
        </span>
      </div>
      {/* Balances the traffic lights so the URL pill stays optically centered */}
      <div className="w-[46px] shrink-0" aria-hidden="true"></div>
    </div>

    {/* Viewport — matches the 16:10 capture ratio so nothing is cropped */}
    <div className="aspect-[16/10] w-full bg-gray-50 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}${image}`}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={1440}
        height={900}
        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
    </div>
  </div>
);

const WorkSection = ({ t }) => {
  const trackRef = React.useRef(null);
  const [progress, setProgress] = React.useState(0);
  const [thumb, setThumb] = React.useState(100);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  // Distance between two cards (card width + gap), read from the DOM so the
  // arrows stay correct across breakpoints without duplicating Tailwind values.
  const getStep = (track) => {
    const [first, second] = track.children;
    if (first && second) return second.offsetLeft - first.offsetLeft;
    return first ? first.offsetWidth : track.clientWidth;
  };

  const syncProgress = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setProgress(max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0);
    // Thumb length mirrors how much of the track is visible, like a scrollbar.
    setThumb(track.scrollWidth > 0 ? Math.max(12, (track.clientWidth / track.scrollWidth) * 100) : 100);
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(max <= 0 || track.scrollLeft >= max - 1);
  }, []);

  // A ResizeObserver fires once on observe, so it covers the initial measurement
  // as well as later reflows (breakpoint changes, images settling in).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const observer = new ResizeObserver(syncProgress);
    observer.observe(track);
    return () => observer.disconnect();
  }, [syncProgress]);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * getStep(track), behavior: 'smooth' });
  };

  // Pointer dragging for mouse users. Touch devices already scroll natively,
  // so hijacking those events would only fight the browser.
  const drag = React.useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const handlePointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    const track = trackRef.current;
    if (!track) return;
    drag.current = { active: true, startX: e.clientX, startScroll: track.scrollLeft, moved: false };
  };

  const handlePointerMove = (e) => {
    const track = trackRef.current;
    if (!drag.current.active || !track) return;
    const delta = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(delta) > 5) {
      drag.current.moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(e.pointerId);
    }
    if (drag.current.moved) track.scrollLeft = drag.current.startScroll - delta;
  };

  const endDrag = (e) => {
    const track = trackRef.current;
    if (!drag.current.active) return;
    drag.current.active = false;
    if (track) {
      track.classList.remove('is-dragging');
      if (e?.pointerId !== undefined) track.releasePointerCapture?.(e.pointerId);
    }
  };

  // A drag that ends over a card would otherwise fire its link. `moved` is reset
  // on the next pointerdown, so a genuine click is never swallowed.
  const handleClickCapture = (e) => {
    if (!drag.current.moved) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const arrowClass = (disabled) =>
    `w-11 h-11 rounded-full border border-black/15 flex items-center justify-center transition-all duration-300 ${
      disabled
        ? 'opacity-25 cursor-not-allowed'
        : 'hover:bg-black hover:text-white hover:border-black'
    }`;

  return (
    <section id="work" className="bg-white py-20 md:py-32 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex flex-col items-center text-center gap-8 mb-10 md:mb-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase">
                {t.work.title}
              </h2>
              <p className="mt-3 text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em]">
                {t.work.hint}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={atStart}
                aria-label={t.work.prev}
                className={arrowClass(atStart)}
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={atEnd}
                aria-label={t.work.next}
                className={arrowClass(atEnd)}
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Full-bleed track: cards snap to the centre, neighbours peek on both sides */}
      <div
        ref={trackRef}
        onScroll={syncProgress}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={handleClickCapture}
        className="work-track flex gap-5 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
      >
        {staticData.projects.map((project) => (
          <a
            key={project.slug}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="work-card group shrink-0 snap-center"
          >
            <BrowserMockup
              domain={project.domain}
              image={project.image}
              alt={`${project.name} — ${project.domain}`}
            />

            <div className="mt-5 md:mt-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter leading-tight truncate">
                  {project.name}
                </h3>
                <p className="mt-1 text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em]">
                  {t.work.roles[project.slug]}
                </p>
              </div>
              <span className="shrink-0 flex items-center gap-1.5 text-gray-500 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] group-hover:text-black transition-colors duration-300 pt-1">
                {t.work.visit}
                <ArrowUpRight size={14} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto px-6 mt-10 md:mt-14">
        <div className="h-px w-full bg-black/10 relative overflow-hidden">
          <div
            className="absolute top-0 h-full bg-black"
            style={{ width: `${thumb}%`, left: `${progress * (100 - thumb)}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
};

const ContactForm = ({ t }) => {
  const [name, setName] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const text = [
      `${t.contact.waIntro} ${name.trim()}.`,
      '',
      `${t.contact.waTopic} ${topic}`,
      '',
      message.trim(),
      '',
      t.contact.waSource
    ].join('\n');

    const url = whatsappLink(text);
    // Abrir em aba nova mantém o site aberto atrás. Se o bloqueador de pop-up
    // barrar mesmo vindo de um clique, navegar na própria aba é melhor do que
    // o botão não fazer nada.
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = url;
  };

  const fieldClass =
    'w-full bg-transparent border-b border-black/15 py-3 text-lg md:text-xl text-black placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors duration-300';
  const labelClass =
    'block text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] mb-1';

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto text-left mt-12 md:mt-16">
      <div className="mb-10">
        <label htmlFor="contact-name" className={labelClass}>
          {t.contact.name}
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.contact.namePlaceholder}
          autoComplete="name"
          className={fieldClass}
        />
      </div>

      <div className="mb-10">
        <label htmlFor="contact-topic" className={labelClass}>
          {t.contact.topic}
        </label>
        <div className="relative">
          <select
            id="contact-topic"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={`${fieldClass} appearance-none pr-8 cursor-pointer ${topic ? '' : 'text-gray-300'}`}
          >
            <option value="" disabled>
              {t.contact.topicPlaceholder}
            </option>
            {t.contact.topics.map((option) => (
              <option key={option} value={option} className="text-black">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            strokeWidth={2}
            aria-hidden="true"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      <div className="mb-10">
        <label htmlFor="contact-message" className={labelClass}>
          {t.contact.message}
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.contact.messagePlaceholder}
          className={`${fieldClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto px-8 py-3 border border-black rounded-full text-black hover:bg-black hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs"
      >
        {t.contact.submit}
      </button>

      <p className="mt-4 text-gray-400 text-xs md:text-sm">{t.contact.note}</p>
    </form>
  );
};

const App = () => {
  const [language, setLanguage] = React.useState('PT');
  const [scrollY, setScrollY] = React.useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'PT' ? 'EN' : 'PT');
  };

  const t = translations[language]; // Current translations

  return (
    <div className="min-h-screen bg-white">
      {/* Responsive Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 md:px-8 md:py-8 flex justify-between items-center bg-white/80 backdrop-blur-sm md:bg-transparent">
        {/* Brand mark. The video is the same asset the About section plays, so
            the browser serves the second instance straight from cache. */}
        <div className="flex-1 flex justify-start">
          <a href="#" className="flex items-center gap-1.5 md:gap-3" aria-label={staticData.name}>
            <span className="text-black text-base md:text-xl font-black tracking-tighter leading-none">
              JG
            </span>
            <span className="hidden md:inline text-black/20 text-xl font-light leading-none select-none" aria-hidden="true">
              |
            </span>
            <video
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              className="w-7 h-7 md:w-10 md:h-10 object-contain -my-1"
            >
              <source
                src={`${import.meta.env.BASE_URL}memoji.mov`}
                type='video/quicktime; codecs="hvc1"'
              />
              <source
                src={`${import.meta.env.BASE_URL}memoji.webm`}
                type="video/webm"
              />
            </video>
          </a>
        </div>

        {/* Center - Language Toggle */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={toggleLanguage}
            className="text-black px-1.5 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider hover:bg-gray-100 transition-colors uppercase flex items-center gap-1"
            aria-label="Change Language"
          >
            <span className={language === 'PT' ? 'opacity-100' : 'opacity-40'}>PT</span>
            <span className="opacity-30">|</span>
            <span className={language === 'EN' ? 'opacity-100' : 'opacity-40'}>EN</span>
          </button>
        </div>

        {/* Right - Navigation Menu */}
        <nav className="flex-1 flex justify-end gap-2.5 md:gap-8">
          <a
            href="#about"
            className="text-black text-[10px] md:text-base font-medium tracking-wide md:tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.about}
          </a>
          <a
            href="#journey"
            className="text-black text-[10px] md:text-base font-medium tracking-wide md:tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.work}
          </a>
          <a
            href="#work"
            className="text-black text-[10px] md:text-base font-medium tracking-wide md:tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.projects}
          </a>
          <a
            href="#contact"
            className="text-black text-[10px] md:text-base font-medium tracking-wide md:tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.contact}
          </a>
        </nav>
      </header>

      {/* Hero Section - Seamless Design */}
      <section className="relative min-h-screen flex items-center overflow-visible bg-white pt-24">
        {/* Fundo fluido. pointer-events-none não atrapalha a interação: o
            componente escuta o mouse na window e testa contra o rect do
            container, então o efeito continua reagindo sem capturar cliques. */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <React.Suspense fallback={null}>
              <LiquidEther
                colors={HERO_FLUID_COLORS}
                mouseForce={20}
                cursorSize={100}
                isViscous={false}
                viscous={30}
                iterationsViscous={32}
                iterationsPoisson={32}
                resolution={0.5}
                isBounce={false}
                autoDemo={true}
                autoSpeed={0.5}
                autoIntensity={1.6}
                takeoverDuration={0.25}
                autoResumeDelay={3000}
                autoRampDuration={0.6}
              />
            </React.Suspense>
          </div>
        )}

        <div className="absolute top-1/2 right-0 -translate-y-1/2 select-none pointer-events-none z-0 overflow-hidden text-right leading-none">
          <span className="block text-[30vw] font-black text-black opacity-[0.05] tracking-tighter">
            JG
          </span>
        </div>
        {/* Name container with Parallax */}
        <div
          className="w-full relative z-20 px-6"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            opacity: Math.max(0, 1 - scrollY / 600)
          }}
        >
          {/* Greeting */}
          <AnimatedSection className="mb-6">
            <span className="text-black text-2xl md:text-3xl lg:text-4xl font-normal opacity-60">
              {t.hero.greeting}
            </span>
          </AnimatedSection>

          {/* Full Name - Large Fluid Typography */}
          <h1
            className="font-medium text-black leading-[0.85] tracking-tighter w-full whitespace-normal md:whitespace-nowrap"
            style={{
              fontSize: 'clamp(3rem, 7.5vw, 180px)',
              marginLeft: '-0.07em'
            }}
          >
            {staticData.name}
          </h1>
        </div>

        {/* Visual Connection Element: Large background letter scrolling slower */}
        <div
          className="absolute -bottom-16 right-0 select-none pointer-events-none opacity-25 -z-10 text-gray-900 hidden lg:block overflow-hidden"
          style={{
            fontSize: '60vw',
            fontWeight: 800,
            transform: `translateY(${scrollY * -0.1}px)`
          }}
        >
          J
        </div>
      </section>

      {/* About Section - Seamless Transition */}
      <section id="about" className="relative bg-white pt-20 md:pt-28 pb-24 md:pb-32 z-10">
        {/* Connection Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent -translate-y-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
            {/* Memoji with 'Anti-Gravity' Parallax */}
            <div
              className="w-full md:w-5/12 flex-shrink-0"
              style={{ transform: `translateY(${Math.max(0, (scrollY - 200) * -0.15)}px)` }}
            >
              <AnimatedSection animation="animate-on-scroll animate-fade-left">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label="João Gabriel"
                  className="w-full max-w-[380px] h-auto mx-auto"
                >
                  {/* Order matters: Safari plays VP9 but ignores its alpha channel,
                      so it has to match the HEVC-with-alpha .mov first. Chrome and
                      Firefox don't claim video/quicktime and fall through to WebM. */}
                  <source
                    src={`${import.meta.env.BASE_URL}memoji.mov`}
                    type='video/quicktime; codecs="hvc1"'
                  />
                  <source
                    src={`${import.meta.env.BASE_URL}memoji.webm`}
                    type="video/webm"
                  />
                </video>
              </AnimatedSection>
            </div>

            {/* Bio Text */}
            <div
              className="w-full md:w-7/12"
              style={{ transform: `translateY(${Math.max(0, (scrollY - 200) * -0.05)}px)` }}
            >
              <AnimatedSection animation="animate-on-scroll animate-fade-right">
                <p className="text-black text-2xl md:text-3xl lg:text-5xl leading-[1.2] tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {renderRichText(t.about.bio)}
                </p>
                {/* Skill Chips */}
                <div className="flex flex-wrap gap-3 mt-8 md:mt-10">
                  {['AI', 'Growth', 'Cripto'].map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-1.5 rounded-full bg-black/[0.03] border border-black/[0.08] backdrop-blur-sm text-gray-600 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] transition-all hover:bg-black/[0.06]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Journey (Timeline) */}
      <section id="journey" className="bg-white py-12 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-4xl md:text-6xl font-black text-black mb-16 md:mb-24 tracking-tighter text-center md:text-left uppercase">
              {t.timeline.title}
            </h2>
          </AnimatedSection>

          {/* Desktop Version (Snake Layout) */}
          <div className="hidden md:flex flex-col gap-y-0">
            {Array.from({ length: Math.ceil(t.timeline.events.length / 2) }).map((_, rowIndex) => {
              const item1 = t.timeline.events[rowIndex * 2];
              const item2 = t.timeline.events[rowIndex * 2 + 1];
              const isForward = rowIndex % 2 === 0;
              const isLastRow = rowIndex === Math.ceil(t.timeline.events.length / 2) - 1;

              return (
                <div
                  key={rowIndex}
                  className={`flex w-full relative ${isForward ? 'flex-row' : 'flex-row-reverse'} 
                    ${isForward ? 'border-r-2 rounded-br-[4rem]' : 'border-l-2 rounded-bl-[4rem]'} 
                    ${isLastRow ? 'border-b-0 rounded-none' : 'border-b-2'} border-black p-0`}
                >
                  {/* Filler before item1 for reverse rows with single item */}
                  {!item2 && !isForward && <div className="w-1/2"></div>}

                  {/* First Item in Row */}
                  <div className={`w-1/2 p-12 lg:p-16 flex flex-col ${isForward ? 'text-right items-end' : 'text-left items-start'}`}>
                    <AnimatedSection transitionDelay={0.1}>
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                        {item1.year}
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-black text-black mb-4 tracking-tighter leading-tight">
                        {item1.title}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed max-w-md font-normal">
                        {renderRichText(item1.description)}
                      </p>
                    </AnimatedSection>
                  </div>

                  {/* Second Item in Row (if exists) */}
                  {item2 && (
                    <div className={`w-1/2 p-12 lg:p-16 flex flex-col ${isForward ? 'text-left items-start' : 'text-right items-end'}`}>
                      <AnimatedSection transitionDelay={0.3}>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                          {item2.year}
                        </span>
                        <h3 className="text-2xl lg:text-3xl font-black text-black mb-4 tracking-tighter leading-tight">
                          {item2.title}
                        </h3>
                        <p className="text-gray-600 text-lg leading-relaxed max-w-md font-normal">
                          {renderRichText(item2.description)}
                        </p>
                      </AnimatedSection>
                    </div>
                  )}

                  {/* Filler for odd numbered items - placed before item1 for reverse rows, after for forward rows */}
                  {!item2 && isForward && <div className="w-1/2"></div>}
                </div>
              );
            })}
          </div>

          {/* Mobile Version (Simple Stack) */}
          <div className="md:hidden flex flex-col border-l-2 border-black ml-2">
            {t.timeline.events.map((event, index) => (
              <div key={index} className="relative pl-8 pb-12 last:pb-0">
                {/* Mobile Dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-black border-4 border-white shadow-sm"></div>

                <AnimatedSection>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                    {event.year}
                  </span>
                  <h3 className="text-xl font-black text-black mb-2 tracking-tighter">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed font-normal">
                    {renderRichText(event.description)}
                  </p>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects & Cases (Carousel) */}
      <WorkSection t={t} />

      {/* Toolkit & Stack Section - Mobile Only */}
      <section className="bg-black py-20 px-6 md:hidden">
        <AnimatedSection>
          <h2 className="text-white text-3xl font-black mb-12 uppercase tracking-tighter">
            {t.toolkit.title}
          </h2>
          <div className="flex flex-col gap-10">
            {t.toolkit.items.map((item, index) => (
              <div key={index} className="border-b border-white/10 pb-6 last:border-0">
                <h3 className="text-white text-2xl font-bold mb-1 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm uppercase tracking-widest font-medium">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white py-32 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 tracking-tight">
              {t.contact.title}
            </h2>
            <p className="text-gray-500 text-base md:text-lg tracking-tight">
              {t.contact.subtitle}
            </p>
            <ContactForm t={t} />
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Favorite Music */}

          <p className="text-gray-500 text-sm md:text-base tracking-tight transition-colors">
            {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
