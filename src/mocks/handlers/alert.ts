import { http, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { AlertRule, AlertChannelType, AlertRuleConfig } from "@/types/alert";
import { ok } from "@/mocks/lib/response";
import { ipage, parsePageSize } from "@/mocks/lib/page";

const CHANNELS: AlertChannelType[] = ["EMAIL", "FEI_SHU", "DING_DING", "SMS"];

function configFor(type: AlertChannelType): AlertRuleConfig | undefined {
  // Only FeiShu carries extra config (webhook + content); other channels are configless.
  if (type === "FEI_SHU") {
    return { webhook: faker.internet.url(), content: { msg_type: "text", text: faker.lorem.sentence() } };
  }
  return undefined;
}

let alertSeq = 0;

function generateAlertRules(count: number): AlertRule[] {
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(CHANNELS);
    const now = faker.date.recent({ days: 90 }).toISOString();
    return {
      id: ++alertSeq,
      name: `${type.toLowerCase()}-${faker.word.noun()}`,
      type,
      config: configFor(type),
      description: faker.lorem.sentence({ min: 3, max: 8 }),
      createdAt: now,
      updatedAt: now,
    };
  });
}

const mockAlertRules: AlertRule[] = generateAlertRules(6);

export const alertRuleHandlers: RequestHandler[] = [
  http.get("/api/alert/list", async () => {
    await delay(150);
    return ok(mockAlertRules);
  }),

  http.get("/api/alert/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockAlertRules, page, size));
  }),

  http.post("/api/alert/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<AlertRule, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const id = ++alertSeq;
    mockAlertRules.push({ ...body, id, createdAt: now, updatedAt: now });
    return ok(id, { status: 201 });
  }),

  http.post("/api/alert/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<AlertRule> & { id: number };
    const rule = mockAlertRules.find((r) => r.id === body.id);
    if (!rule) return ok(0);
    Object.assign(rule, body, { updatedAt: new Date().toISOString() });
    return ok(1);
  }),

  http.get("/api/alert/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockAlertRules.findIndex((r) => r.id === Number(id));
    if (idx !== -1) mockAlertRules.splice(idx, 1);
    return ok(idx !== -1);
  }),
];
