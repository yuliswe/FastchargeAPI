/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response, fetch } from "@remix-run/web-fetch";
import { TextDecoder, TextEncoder } from "util";

globalThis.TextEncoder = TextEncoder;
// @ts-ignore
globalThis.TextDecoder = TextDecoder;
globalThis.Request = Request;
// @ts-ignore
globalThis.Response = Response;
globalThis.fetch = async (...args) => {
  console.log("fetch request", args);
  // @ts-ignore
  const resp = await fetch(...args);
  console.log(`fetch response [${resp.status} ${resp.statusText}]`, await resp.clone().text());
  return resp;
};
