export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONPrimitive = string | number | boolean | null;
export interface JSONObject {
  readonly [member: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}
