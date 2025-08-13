declare module 'mjml' {
  export default function mjml2html(mjml: string): { html: string; errors: any[] };
}