import { http, HttpResponse, delay, type RequestHandler } from 'msw'
import { faker } from '@faker-js/faker'
import type { AlertPolicy, SystemMetric } from '@/types/monitor'
import { paginate } from '@/utils/pagination'

function parsePagination(url: URL): { page: number; pageSize: number } {
  return {
    page: Number(url.searchParams.get('page')) || 1,
    pageSize: Number(url.searchParams.get('pageSize')) || 10,
  }
}

// ---- Seed data generated with faker ----

function generateAlerts(): AlertPolicy[] {
  const targets = [
    'workflow-failure-rate',
    'system-cpu',
    'system-memory',
    'system-disk',
    'workflow-timeout',
    'network-latency',
    'jvm-heap',
  ]
  const conditions = ['greater_than', 'less_than', 'equal_to']
  const notifyMethods = ['email', 'webhook', 'sms'] as const

  return Array.from({ length: faker.number.int({ min: 4, max: 6 }) }, () => ({
    id: `alert-${faker.string.nanoid(6)}`,
    name: `${faker.helpers.arrayElement(['任务失败率', 'CPU 使用率', '内存使用率', '磁盘空间', '任务超时', '网络延迟'])}告警`,
    target: faker.helpers.arrayElement(targets),
    condition: faker.helpers.arrayElement(conditions),
    threshold: faker.number.int({ min: 10, max: 95 }),
    notifyMethod: faker.helpers.arrayElement(notifyMethods),
    enabled: faker.datatype.boolean(),
  }))
}

const mockAlerts: AlertPolicy[] = generateAlerts()

export const monitorHandlers: RequestHandler[] = [
  // ---- Alert Policies ----

  // GET /api/alerts
  http.get('/api/alerts', async ({ request }) => {
    await delay(200)
    const { page, pageSize } = parsePagination(new URL(request.url))
    return HttpResponse.json(paginate(mockAlerts, page, pageSize))
  }),

  // POST /api/alerts
  http.post('/api/alerts', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Omit<AlertPolicy, 'id'>
    const alert: AlertPolicy = { ...body, id: `alert-${faker.string.nanoid(6)}` }
    mockAlerts.push(alert)
    return HttpResponse.json(alert, { status: 201 })
  }),

  // PUT /api/alerts/:id
  http.put('/api/alerts/:id', async ({ params, request }) => {
    await delay(200)
    const { id } = params as { id: string }
    const body = (await request.json()) as Partial<Omit<AlertPolicy, 'id'>>
    const alert = mockAlerts.find((a) => a.id === id)
    if (!alert) {
      return HttpResponse.json({ message: '告警策略不存在' }, { status: 404 })
    }
    Object.assign(alert, body)
    return HttpResponse.json(alert)
  }),

  // ---- System Metrics ----

  // GET /api/metrics
  http.get('/api/metrics', async () => {
    await delay(200)
    const now = new Date().toISOString()

    const metrics: SystemMetric[] = [
      { name: 'CPU 使用率', value: faker.number.float({ min: 20, max: 95, fractionDigits: 1 }), unit: '%', timestamp: now },
      { name: '内存使用率', value: faker.number.float({ min: 40, max: 90, fractionDigits: 1 }), unit: '%', timestamp: now },
      { name: '磁盘使用率', value: faker.number.float({ min: 30, max: 85, fractionDigits: 1 }), unit: '%', timestamp: now },
      { name: '网络入流量', value: faker.number.float({ min: 10, max: 500, fractionDigits: 0 }), unit: 'Mbps', timestamp: now },
      { name: '网络出流量', value: faker.number.float({ min: 5, max: 300, fractionDigits: 0 }), unit: 'Mbps', timestamp: now },
      { name: 'JVM 堆内存', value: faker.number.float({ min: 1, max: 8, fractionDigits: 1 }), unit: 'GB', timestamp: now },
    ]

    return HttpResponse.json(metrics)
  }),
]
