import { HttpResponse } from "msw";

/** Wrap `data` in the backend success envelope `{ code: 0, desc, data }`. */
export function ok<T>(data: T, init?: ResponseInit): HttpResponse {
  return HttpResponse.json({ code: 0, desc: "success", data }, init);
}

/** Build a backend error envelope `{ code, desc, data: null }`. */
export function fail(code: number, desc: string, init?: ResponseInit): HttpResponse {
  return HttpResponse.json({ code, desc, data: null }, init);
}
