'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bike,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  Phone,
  Radio,
  Route,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TimerReset,
  Truck,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

const whatsapp = 'https://wa.me/5491100000000?text=Hola%20ServiTec%2C%20quiero%20pedir%20una%20demo'

const feedItems = [
  ['Juan tomó un envío', 'Pizzería Don José'],
  ['Envío entregado', 'hace 1 min'],
  ['Nuevo pedido', 'Burger Bros'],
  ['Mica está en ruta', 'Farmacia Central'],
]

const benefits = [
  [Radio, 'Seguimiento en vivo', 'Sabé dónde está cada envío sin perseguir mensajes.'],
  [WalletCards, 'Cuenta corriente por cadete', 'Rendiciones claras, ordenadas y siempre a mano.'],
  [Store, 'Página propia para pedir', 'Una puerta de entrada simple para tus comercios.'],
  [Users, 'Estados en un clic', 'Activá o pausá cadetes según lo que necesites.'],
  [TimerReset, 'Liquidación semanal', 'Cerrá la semana con números listos para liquidar.'],
  [PackageCheck, 'Para cualquier mensajería', 'Comida, farmacia, documentos o lo que mueva tu ciudad.'],
]

const faq = [
  ['¿Tengo que cambiar la forma en que trabajo hoy?', 'No. ServiCadete ordena lo que ya hacés y reemplaza los chats cruzados por un flujo claro para comercios, cadetes y administración.'],
  ['¿Los cadetes necesitan descargar una app?', 'No necesariamente. Pueden operar desde el celular con una experiencia simple y pensada para usar mientras están en la calle.'],
  ['¿Puedo ver cuánto tiene que rendir cada cadete?', 'Sí. Cada movimiento queda asociado al cadete y podés consultar su cuenta corriente en tiempo real.'],
  ['¿Sirve si tengo pocos cadetes?', 'Sí. Está pensado para empezar simple y crecer con tu operación, sin planillas difíciles de mantener.'],
  ['¿Cuánto cuesta?', 'Armamos una propuesta según la cantidad de cadetes, comercios y movimientos de tu mensajería.'],
]

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>
}

function Mark({ small = false }: { small?: boolean }) {
  return <div className={`brand-mark ${small ? 'brand-mark-small' : ''}`}><span className="brand-dot" /><span>Servi<span className="text-lime">Cadete</span></span></div>
}

function CityMap() {
  const reduce = useReducedMotion()
  const routes = ['M62 340 C112 270 130 180 232 155 S360 170 460 88', 'M35 90 C126 138 166 210 260 226 S382 280 488 318', 'M92 374 C170 320 185 250 320 238 S390 150 470 120']
  return <div className="map-shell">
    <div className="map-topline"><span><span className="live-dot" /> EN VIVO</span><span>OP / 04</span></div>
    <svg className="city-map" viewBox="0 0 520 420" role="img" aria-label="Mapa esquemático con cadetes en movimiento">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter><pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="rgba(139,158,190,.15)" strokeWidth="1" /></pattern></defs>
      <rect width="520" height="420" fill="url(#grid)" />
      <path d="M-10 110 L530 110 M-10 250 L530 250 M170 -10 L170 430 M355 -10 L355 430" stroke="rgba(139,158,190,.18)" strokeWidth="2" />
      <path d="M30 56 L490 360 M490 50 L20 350 M100 -20 L430 440" stroke="rgba(54,211,199,.14)" strokeWidth="2" />
      {routes.map((d, i) => <path key={d} d={d} fill="none" stroke={i === 1 ? '#b7f34b' : '#36d3c7'} strokeWidth="2" strokeDasharray="5 9" opacity=".55" />)}
      {[['90','110'], ['390','102'], ['275','294'], ['446','316'], ['180','200']].map(([cx, cy], i) => <g key={`${cx}-${cy}`} className="map-pin"><circle cx={cx} cy={cy} r="13" fill="rgba(183,243,75,.12)" stroke="#b7f34b" /><circle cx={cx} cy={cy} r="4" fill="#b7f34b" filter="url(#glow)" /><text x={Number(cx) + 18} y={Number(cy) + 4} fill="rgba(231,240,247,.55)" fontSize="9">{['PIZZERÍA', 'FARMACIA', 'BURGER', 'KIOSCO', 'DOCS'][i]}</text></g>)}
      {routes.map((d, i) => <motion.g key={i} animate={reduce ? undefined : { offsetDistance: ['0%', '100%'] }} style={{ offsetPath: `path('${d}')` }} transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * -2 }}><circle r="8" fill="#060a18" stroke="#36d3c7" strokeWidth="2" /><Bike size={16} x="-8" y="-8" color="#b7f34b" /></motion.g>)}
    </svg>
    <LiveFeed />
    <div className="map-legend"><span><i className="legend-line lime" /> ruta activa</span><span><i className="legend-line cyan" /> cadete en movimiento</span></div>
  </div>
}

function LiveFeed() {
  const [index, setIndex] = useState(0)
  useEffect(() => { const timer = setInterval(() => setIndex((i) => (i + 1) % feedItems.length), 2600); return () => clearInterval(timer) }, [])
  return <div className="live-feed"><div className="feed-heading"><span><span className="live-dot" /> EN VIVO</span><MoreHorizontal size={15} /></div><AnimatePresence mode="wait"><motion.div key={index} className="feed-event" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .4 }}><span className="feed-icon"><Bike size={14} /></span><span><strong>{feedItems[index][0]}</strong><small>{feedItems[index][1]}</small></span><span className="feed-time">ahora</span></motion.div></AnimatePresence><div className="feed-progress"><motion.span key={index} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.6, ease: 'linear' }} /></div></div>
}

function PhoneMockup() {
  const [step, setStep] = useState(0)
  const stages = [['Envío disponible', 'Retirá un pedido en Nueva Córdoba', 'Tomar envío'], ['En camino al retiro', 'Pizzería Don José · 1.2 km', 'Marcar retirado'], ['Pedido retirado', 'Entregá en Av. Colón 1240', 'Marcar entregado'], ['¡Entregado!', 'Movimiento guardado correctamente', 'Listo']]
  useEffect(() => { const timer = setInterval(() => setStep((s) => (s + 1) % 4), 2600); return () => clearInterval(timer) }, [])
  return <div className="phone-wrap"><div className="phone"><div className="phone-notch" /><div className="phone-status"><span>09:41</span><span>••• ◼</span></div><div className="phone-appbar"><Mark small /><Settings2 size={15} /></div><div className="earn-card"><span>DEBÉS RENDIR</span><strong>$4.800</strong><div><span className="tiny-bar" /><span>+ $1.200 en ruta</span></div></div><div className="phone-label">MI JORNADA <span>ACTIVA</span></div><AnimatePresence mode="wait"><motion.div key={step} className="delivery-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><div className={`delivery-icon state-${step}`}>{step === 3 ? <Check size={24} /> : <Bike size={22} />}</div><small>ENVÍO #{step + 1842}</small><h4>{stages[step][0]}</h4><p>{stages[step][1]}</p><button className="phone-action">{stages[step][2]} <ArrowRight size={14} /></button></motion.div></AnimatePresence><div className="phone-nav"><span className="active"><Route size={17} />Mis envíos</span><span><WalletCards size={17} />Mi cuenta</span><span><MoreHorizontal size={17} />Más</span></div></div></div>
}

function Dashboard() {
  return <div className="dashboard"><div className="dash-head"><div><span className="eyebrow">OPERACIÓN / <span className="text-lime">● EN VIVO</span></span><h3>Panel general</h3></div><span className="demo-tag">Datos de demostración</span></div><div className="kpi-grid"><div><span>ENVÍOS HOY</span><strong>128</strong><small>+18% <span>vs. ayer</span></small></div><div><span>CADETES ACTIVOS</span><strong>12</strong><small className="cyan-text">en movimiento</small></div><div><span>A RENDIR</span><strong>$86.4k</strong><small>18 movimientos</small></div></div><div className="dash-columns"><div className="riders"><div className="dash-section-title"><span>CADETES</span><span>ver todos <ArrowRight size={12} /></span></div>{[['Juan Pérez','En ruta','#b7f34b'],['Micaela Ruiz','Disponible','#36d3c7'],['Nico López','En ruta','#b7f34b'],['Sofi Acosta','Inactivo','#667085']].map(([name,status,color]) => <div className="rider" key={name}><span className="rider-avatar"><Bike size={14} /></span><span><strong>{name}</strong><small><i style={{ background: color }} />{status}</small></span><MoreHorizontal size={15} /></div>)}</div><div className="week-chart"><div className="dash-section-title"><span>ENVÍOS / SEMANA</span><BarChart3 size={15} /></div><div className="bars">{[44,68,52,82,63,93,76].map((height, i) => <div className="bar-col" key={i}><motion.i initial={{ height: 0 }} whileInView={{ height: `${height}%` }} viewport={{ once: true }} transition={{ duration: .8, delay: i * .06 }} /><small>{['L','M','X','J','V','S','D'][i]}</small></div>)}</div></div></div></div>
}

function FAQItem({ question, answer }: { question: string; answer: string }) { const [open, setOpen] = useState(false); return <div className={`faq-item ${open ? 'open' : ''}`}><button onClick={() => setOpen(!open)} aria-expanded={open}><span>{question}</span><ChevronDown size={18} /></button><AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{answer}</p></motion.div>}</AnimatePresence></div> }

export default function Page() {
  const [menu, setMenu] = useState(false)
  return <main className="site-shell">
    <nav className="navbar"><div className="nav-inner"><a href="#inicio" aria-label="ServiCadete inicio"><Mark /></a><div className={`nav-links ${menu ? 'open' : ''}`}><a href="#como-funciona" onClick={() => setMenu(false)}>Cómo funciona</a><a href="#beneficios" onClick={() => setMenu(false)}>Beneficios</a><a href="#precios" onClick={() => setMenu(false)}>Precios</a><a href="#faq" onClick={() => setMenu(false)}>FAQ</a></div><div className="nav-actions"><Link className="nav-login" href="/login">Ingresar</Link><a className="nav-cta" href={whatsapp}>Pedí una demo <ArrowRight size={15} /></a><button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Abrir menú">{menu ? <X /> : <Menu />}</button></div></div></nav>
    <section className="hero section-pad" id="inicio"><div className="hero-copy"><Reveal><span className="eyebrow"><span className="live-dot" /> LOGÍSTICA PARA HACERLO SIMPLE</span><h1>Tus cadetes.<br />Tus envíos.<br /><em>En vivo.</em></h1><p className="hero-sub">Dejá de coordinar por WhatsApp. Pedidos, cadetes y rendiciones de efectivo desde el celular.</p><div className="hero-actions"><a className="button-primary" href={whatsapp}>Pedí una demo <ArrowRight size={16} /></a><a className="button-ghost" href="#como-funciona"><span className="play-icon">▶</span> Ver cómo funciona</a></div><div className="hero-proof"><span className="avatar-stack"><i>J</i><i>M</i><i>N</i></span><span>Hecho para equipos que<br /><strong>mueven la ciudad.</strong></span></div></Reveal></div><Reveal delay={.15} className="hero-visual"><CityMap /></Reveal></section>
    <div className="marquee"><div className="marquee-track">{[...Array(2)].flatMap(() => ['COMIDAS','FARMACIAS','MENSAJERÍA','KIOSCOS','HELADERÍAS','DOCUMENTOS','ENCOMIENDAS','PERSONALIZADO']).map((item, i) => <span key={`${item}-${i}`}>{item} <b>✳</b></span>)}</div></div>
    <section className="section-pad problem" id="beneficios"><Reveal><span className="eyebrow">UNA IDEA SIMPLE / 01</span><h2>Coordinar cadetes por WhatsApp<br /><em>no escala.</em></h2><p className="section-intro">Cuando los pedidos crecen, el chat se vuelve un laberinto. ServiCadete convierte el caos de todos los días en una operación que podés mirar y entender.</p></Reveal><div className="problem-grid">{[[MessageCircle,'Pedidos perdidos en el chat','Un mensaje se entierra y nadie sabe quién lo tomó.'],[CircleDollarSign,'Rendiciones que no cierran','El efectivo se mezcla y las cuentas no dan.'],[FileSpreadsheet,'Cierres semanales en Excel','Horas buscando datos en planillas distintas.']].map(([Icon,title,desc], i) => <Reveal key={title as string} delay={i * .1}><div className="problem-card"><div className="card-number">0{i + 1}</div><div className="problem-icon"><Icon size={25} /></div><h3>{title as string}</h3><p>{desc as string}</p><span className="card-arrow">↗</span></div></Reveal>)}</div></section>
    <section className="section-pad process" id="como-funciona"><Reveal><span className="eyebrow">SISTEMA / 02</span><h2>Todo lo que pasa,<br /><em>en un solo lugar.</em></h2></Reveal><div className="process-grid"><div className="steps">{[['01','El comercio pide','un cadete con un botón.'],['02','El cadete lo toma','y lo entrega desde su celular.'],['03','Vos ves todo en vivo','y sabés cuánto rinde cada cadete.']].map(([n,t,d], i) => <Reveal delay={i * .12} key={n}><div className="step"><span className="step-num">{n}</span><div><h3>{t}</h3><p>{d}</p></div><ArrowRight size={17} /></div></Reveal>)}</div><PhoneMockup /></div></section>
    <section className="section-pad operation"><Reveal><div className="section-row"><div><span className="eyebrow">DATOS CLAROS / 03</span><h2>Tu operación,<br /><em>sin puntos ciegos.</em></h2></div><p className="section-intro">Un tablero para ver el pulso de tu mensajería: envíos, cadetes y plata a rendir.</p></div></Reveal><Reveal delay={.1}><Dashboard /></Reveal></section>
    <section className="section-pad benefits"><Reveal><span className="eyebrow">TODO LO QUE NECESITÁS / 04</span><h2>Menos vueltas.<br /><em>Más entregas.</em></h2></Reveal><div className="benefit-grid">{benefits.map(([Icon, title, desc], i) => <Reveal key={title as string} delay={i * .06}><div className="benefit-card"><Icon size={21} /><span className="benefit-index">0{i + 1}</span><h3>{title as string}</h3><p>{desc as string}</p></div></Reveal>)}</div></section>
    <section className="section-pad own-page"><div className="own-copy"><Reveal><span className="eyebrow">TU PROPIA PUERTA DE ENTRADA / 05</span><h2>Que pedir un cadete<br />sea <em>un botón.</em></h2><p className="section-intro">Cada mensajería tiene su propia página para recibir pedidos. Compartila con tus comercios y empezá a mover envíos.</p><a href={whatsapp} className="text-link">Quiero mi página <ArrowRight size={15} /></a></Reveal></div><Reveal delay={.15}><div className="order-page"><div className="browser-bar"><span /><span /><span /><small>tuapp.com/tu-mensajeria</small></div><div className="order-content"><Mark /><span className="eyebrow">MENSAJERÍA URBANA</span><h3>Movemos lo que<br /><em>necesitás.</em></h3><p>Pedí un cadete en segundos.</p><button>Pedir cadete <Send size={16} /></button><span className="order-note"><ShieldCheck size={14} /> Seguimiento incluido</span></div></div></Reveal></section>
    <section className="section-pad pricing" id="precios"><Reveal><span className="eyebrow">TRANSPARENTE / 06</span><h2>Empezá a ordenar<br /><em>hoy.</em></h2></Reveal><Reveal delay={.1}><div className="price-card"><div className="price-glow" /><div className="price-content"><span className="price-label">PLAN MENSAJERÍA</span><h3>A medida <Sparkles size={18} /></h3><p>Una herramienta que crece con tus movimientos.</p><div className="price-line"><strong>Precio a definir</strong><span>según tu operación</span></div><ul>{['Panel de operación en vivo','Página propia para recibir pedidos','Cuenta corriente por cadete','Soporte de implementación'].map(item => <li key={item}><Check size={15} /> {item}</li>)}</ul><a href={whatsapp} className="button-primary">Hablemos de tu operación <ArrowRight size={16} /></a></div><div className="price-side"><span>¿Tenés una pregunta?</span><a href={whatsapp}><MessageCircle size={17} /> Escribinos por WhatsApp</a></div></div></Reveal></section>
    <section className="section-pad faq" id="faq"><Reveal><div><span className="eyebrow">PREGUNTAS FRECUENTES / 07</span><h2>Lo que querés<br /><em>saber.</em></h2></div><div className="faq-list">{faq.map(([q,a]) => <FAQItem key={q} question={q} answer={a} />)}</div></Reveal></section>
    <section className="final-cta"><div className="route-bg"><Route size={340} /></div><div className="final-content"><span className="eyebrow">EL PRÓXIMO PASO</span><h2>Hablemos de<br /><em>tu mensajería.</em></h2><p>Te mostramos cómo se vería tu operación con todo en un solo lugar.</p><a href={whatsapp} className="button-primary">Pedí una demo <ArrowRight size={16} /></a></div></section>
    <footer className="footer"><div><Mark /><p>La operación que mueve tu ciudad.</p></div><div className="footer-links"><a href="#como-funciona">Cómo funciona</a><a href="#beneficios">Beneficios</a><a href="#precios">Precios</a><a href="#faq">FAQ</a></div><div className="footer-credit">Desarrollado por <a href="https://servitec.net.ar" target="_blank" rel="noreferrer">ServiTec ↗</a></div></footer>
    <a className="floating-wa" href={whatsapp} aria-label="Contactar por WhatsApp"><MessageCircle size={24} /></a>
  </main>
}
