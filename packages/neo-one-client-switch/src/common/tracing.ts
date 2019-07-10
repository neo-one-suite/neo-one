interface BaseSpan {
  readonly addAttribute: (key: string, value: string | number | boolean) => void;
}

// tslint:disable-next-line: export-name
export const addAttributesToSpan = <Span extends BaseSpan>(
  span: Span,
  attributes: Record<string, string | number | boolean>,
) => {
  Object.entries(attributes).forEach(([key, value]) => {
    span.addAttribute(key, value);
  });
};
