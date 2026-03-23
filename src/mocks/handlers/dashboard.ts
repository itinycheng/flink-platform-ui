import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

export const dashboardHandlers = [
  // GET /api/dashboard/stats
  http.get('/api/dashboard/stats', async () => {
    await delay(200)

    const success = faker.number.int({ min: 800, max: 1200 })
    const failed = faker.number.int({ min: 20, max: 80 })
    const running = faker.number.int({ min: 5, max: 30 })

    return HttpResponse.json({
      totalTasks: success + failed + running,
      successTasks: success,
      failedTasks: failed,
      runningTasks: running,
    })
  }),

  // GET /api/dashboard/trend
  http.get('/api/dashboard/trend', async ({ request }) => {
    await delay(200)

    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '7d'
    const days = range === '30d' ? 30 : range === '14d' ? 14 : 7

    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      data.push({
        date: d.toISOString().slice(0, 10),
        success: faker.number.int({ min: 100, max: 200 }),
        failed: faker.number.int({ min: 2, max: 15 }),
        running: faker.number.int({ min: 1, max: 8 }),
      })
    }

    return HttpResponse.json(data)
  }),
]
