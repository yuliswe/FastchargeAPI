/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response, fetch } from "@remix-run/web-fetch";
import { TextDecoder, TextEncoder } from "util";

globalThis.TextEncoder = TextEncoder;
// @ts-ignore
globalThis.TextDecoder = TextDecoder;
globalThis.Request = Request;
// @ts-ignore
globalThis.Response = Response;
globalThis.fetch = fetch;
