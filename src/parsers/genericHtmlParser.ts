// Parser genérico de HTML/texto: procura linhas no formato
// "data hora Time A x Time B — Estádio".
import type { Parser } from "./baseParser";
import { parseMatchLines, stripHtml } from "./baseParser";

export const genericHtmlParser: Parser = {
  id: "generic-html",
  label: "HTML genérico",
  priority: 10,
  canParse(content) {
    return parseMatchLines(stripHtml(content)).length > 0;
  },
  parse(content, context) {
    return parseMatchLines(stripHtml(content), context.competition);
  },
};
