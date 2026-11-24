import { usePageMeta } from '@/lib/meta';
import { LEGAL_VERSION, type LegalPageContent } from '@/content/legal';
import { Link } from 'wouter';

export function LegalContents({ content }: { content: LegalPageContent }) {
  usePageMeta({ title: content.title, description: content.description, path: content.path });
  return <main className="container legal-page" lang="it">
    <h1>{content.title}</h1>
    <p>{content.intro}</p>
    {content.blocks.map(block => <section key={block.h}>
      <h2>{block.h}</h2>
      {block.p?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {content.path === '/privacy' && block.h === 'Contenuti generati con intelligenza artificiale' &&
        <p><Link href="/uso-intelligenza-artificiale">Uso dell’intelligenza artificiale: testi, traduzioni, immagini e supervisione umana</Link></p>}
      {block.ul && <ul>{block.ul.map(item => <li key={item}>{item}</li>)}</ul>}
      {block.links && <ul>{block.links.map(link => <li key={link.href}><a href={link.href} rel="noreferrer" referrerPolicy="no-referrer">{link.label}</a></li>)}</ul>}
    </section>)}
    <p>Versione {LEGAL_VERSION}</p>
  </main>;
}
