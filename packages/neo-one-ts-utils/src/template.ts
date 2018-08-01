import ts from 'typescript';

export function getTemplateHead(node: ts.TemplateExpression): ts.TemplateHead {
  return node.head;
}

export function getTemplateSpans(node: ts.TemplateExpression): ts.NodeArray<ts.TemplateSpan> {
  return node.templateSpans;
}

export function getLiteral(node: ts.TemplateSpan): ts.TemplateMiddle | ts.TemplateTail {
  return node.literal;
}

export function getTag(node: ts.TaggedTemplateExpression): ts.Expression {
  return node.tag;
}

export function getTemplate(node: ts.TaggedTemplateExpression): ts.TemplateLiteral {
  return node.template;
}
