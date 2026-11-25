/** New Arabic adaptations, never represented as recovered historical originals. */
export type ArabicEditorialArticle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  sourcePath: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  faq?: [string, string][];
};
