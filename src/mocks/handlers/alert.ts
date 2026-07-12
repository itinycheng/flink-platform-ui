import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { AlertRule, AlertChannelType } from "@/types/alert";
import { paginate } from "@/utils/pagination";

const CHANNELS: AlertChannelType[] = ["email", "sms", "dingtalk", "wechat", "webhook"];

function configFor(type: AlertChannelType): string {
  switch (type) {
    case "email":
      return JSON.stringify({ recipients: [faker.internet.email()] }, null, 2);
    case "sms":
      return JSON.stringify({ phones: [faker.phone.number()] }, null, 2);
    case "webhook":
      return JSON.stringify({ url: faker.internet.url() }, null, 2);
    default:
      return JSON.stringify({ webhook: faker.internet.url(), atAll: false }, null, 2);
  }
}

function generateAlertRules(count: number): AlertRule[] {
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(CHANNELS);
    const now = faker.date.recent({ days: 90 }).toISOString();
    return {
      id: `ar-${faker.string.nanoid(6)}`,
      name: `${type}-${faker.word.noun()}`,
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
  http.get("/api/alert-rules/all", async () => {
    await delay(150);
    return HttpResponse.json(mockAlertRules);
  }),

  http.get("/api/alert-rules", async ({ request }) => {
    await delay(200);
    const p = new URL(request.url).searchParams;
    const page = Number(p.get("page")) || 1;
    const pageSize = Number(p.get("pageSize")) || 10;
    return HttpResponse.json(paginate(mockAlertRules, page, pageSize));
  }),

  http.post("/api/alert-rules", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<AlertRule, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const rule: AlertRule = { ...body, id: `ar-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockAlertRules.push(rule);
    return HttpResponse.json(rule, { status: 201 });
  }),

  http.put("/api/alert-rules/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<AlertRule>;
    const rule = mockAlertRules.find((r) => r.id === id);
    if (!rule) return HttpResponse.json({ message: "告警规则不存在" }, { status: 404 });
    Object.assign(rule, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(rule);
  }),

  http.delete("/api/alert-rules/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockAlertRules.findIndex((r) => r.id === id);
    if (idx === -1) return HttpResponse.json({ message: "告警规则不存在" }, { status: 404 });
    mockAlertRules.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
