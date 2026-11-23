import { usePageMeta } from '@/lib/meta';
import { LEGAL_VERSION, type LegalPageContent } from '@/content/legal';

export function LegalContents({ content }: { content: LegalPageContent }) {
  usePageMeta({ title: content.title, description: content.description, path: content.path });
  return <main className="container legal-page" lang="it">
    <h1>{content.title}</h1>
    <p>{content.intro}</p>
    {content.blocks.map(block => <section key={block.h}>
      <h2>{block.h}</h2>
      {block.p?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {block.ul && <ul>{block.ul.map(item => <li key={item}>{item}</li>)}</ul>}
      {block.links && <ul>{block.links.map(link => <li key={link.href}><a href={link.href} rel="noreferrer" referrerPolicy="no-referrer">{link.label}</a></li>)}</ul>}
    </section>)}
    <p>Versione {LEGAL_VERSION}</p>
  </main>;
}
