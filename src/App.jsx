import React, { useEffect, useRef, useState } from 'react';
import { Github, Linkedin, Twitter, Mail, BookOpen, Code, Palette, Coffee, Heart, Lightbulb } from 'lucide-react';

// Custom hook for scroll animations
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
};

// Animated component wrapper
const AnimatedSection = ({ children, className = '', animation = 'animate-on-scroll' }) => {
  const [ref, isVisible] = useInView();
  return (
    <div ref={ref} className={`${animation} ${isVisible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
};

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
      work: 'Trabalho',
      contact: 'Contato'
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
          description: "Be Honest Brasil. Gestão de tráfego pago e otimização de Landing Pages."
        },
        {
          year: "Dez 2024 – Presente",
          title: "Head de Growth Marketing",
          description: "Focado em performance e canais de aquisição na Be Honest Brasil, onde graças ao trabalho da equipe conseguimos \"dobrar de tamanho\" em 1 ano."
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
      email: "joaogabrielsantosanjos@gmail.com",
      social: "LinkedIn / Perfil Profissional"
    },
    favoriteMusic: "Minha música favorita:",
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
      work: 'Work',
      contact: 'Contact'
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
          description: "Be Honest Brasil. Paid traffic management and Landing Page optimization."
        },
        {
          year: "Dec 2024 – Present",
          title: "Head of Growth Marketing",
          description: "Focused on performance and acquisition channels at Be Honest Brasil, where thanks to the team's work we managed to \"double in size\" in 1 year."
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
      email: "joaogabrielsantosanjos@gmail.com",
      social: "LinkedIn / Professional Profile"
    },
    favoriteMusic: "My favorite music:",
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
  eventColors: ["bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-red-500"]
};

// ============================================
// COMPONENTES
// ============================================

const App = () => {
  const [language, setLanguage] = React.useState('PT');
  const [scrollY, setScrollY] = React.useState(0);

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
        {/* Left Spacer - can be used for a logo later */}
        <div className="flex-1"></div>

        {/* Center - Language Toggle */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={toggleLanguage}
            className="text-black px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider hover:bg-gray-100 transition-colors uppercase"
          >
            {language}
          </button>
        </div>

        {/* Right - Navigation Menu */}
        <nav className="flex-1 flex justify-end gap-4 md:gap-8">
          <a
            href="#about"
            className="text-black text-xs md:text-base font-medium tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.about}
          </a>
          <a
            href="#journey"
            className="text-black text-xs md:text-base font-medium tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.work}
          </a>
          <a
            href="#contact"
            className="text-black text-xs md:text-base font-medium tracking-wider hover:text-gray-600 transition-colors uppercase whitespace-nowrap"
          >
            {t.nav.contact}
          </a>
        </nav>
      </header>

      {/* Hero Section - Seamless Design */}
      <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-center overflow-visible bg-white pt-24">
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
      <section id="about" className="relative bg-white pt-12 pb-24 md:pb-32 z-10">
        {/* Connection Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent -translate-y-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
            {/* Photo with 'Anti-Gravity' Parallax */}
            <div
              className="w-full md:w-5/12 flex-shrink-0"
              style={{ transform: `translateY(${Math.max(0, (scrollY - 200) * -0.15)}px)` }}
            >
              <AnimatedSection animation="animate-on-scroll animate-fade-left">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gray-100 rounded-2xl -z-10 group-hover:bg-gray-200 transition-colors duration-500"></div>
                  <img
                    src={`${import.meta.env.BASE_URL}about-photo-v2.jpg`}
                    alt="João Gabriel"
                    className="w-full h-auto rounded-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700"
                  />
                </div>
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

                  {/* Filler for odd numbered items */}
                  {!item2 && <div className="w-1/2"></div>}
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
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-10 tracking-tight">
              {t.contact.title}
            </h2>
            <a
              href={`mailto:${t.contact.email}`}
              className="block text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light text-gray-900 hover:text-gray-500 transition-colors duration-300 tracking-tight break-all sm:break-normal text-center underline decoration-1 underline-offset-8 decoration-gray-300 hover:decoration-gray-500"
            >
              {t.contact.email}
            </a>
            <div className="mt-12">
              <a
                href="https://www.linkedin.com/in/jo%C3%A3o-gabrieldsda/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 border border-black rounded-full text-black hover:bg-black hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs"
              >
                {t.contact.social}
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Favorite Music */}
          <div className="flex flex-col items-center justify-center mb-6 space-y-2">
            <span className="text-xs font-light text-gray-500 uppercase tracking-wider">
              {t.favoriteMusic}
            </span>
            <a
              href="https://open.spotify.com/intl-pt/track/4e9eGQYsOiBcftrWXwsVco?si=8e3d04712ea1432b"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={`${import.meta.env.BASE_URL}favorite-music.png`}
                alt="System of a Down - Toxicity"
                className="w-12 h-12 rounded-md shadow-sm object-cover bg-gray-800 transition-opacity duration-300 hover:opacity-80"
                loading="lazy"
              />
            </a>
          </div>
          <p className="text-gray-500 text-sm md:text-base tracking-tight transition-colors">
            {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
