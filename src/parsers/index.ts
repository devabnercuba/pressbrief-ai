// Registro de parsers. Adicionar um novo parser não exige alteração no
// restante do sistema — basta registrá-lo aqui (ou via `registerParser`).
import type { ParseContext, Parser } from "./baseParser";
import { cbfParser } from "./cbfParser";
import { fcfParser } from "./fcfParser";
import { genericHtmlParser } from "./genericHtmlParser";
import { genericTableParser } from "./genericTableParser";

const parsers = new Map<string, Parser>();

export function registerParser(parser: Parser): void {
  parsers.set(parser.id, parser);
}

export function listParsers(): Parser[] {
  return Array.from(parsers.values()).sort((a, b) => b.priority - a.priority);
}

export function selectParser(content: string, context: ParseContext): Parser | undefined {
  return listParsers().find((parser) => {
    try {
      return parser.canParse(content, context);
    } catch {
      return false;
    }
  });
}

[cbfParser, fcfParser, genericTableParser, genericHtmlParser].forEach(registerParser);

export { cbfParser, fcfParser, genericTableParser, genericHtmlParser };
