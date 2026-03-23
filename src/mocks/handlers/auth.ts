import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

export const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { username?: string; password?: string }

    // Simulate invalid credentials
    if (body.username !== 'admin' && body.username !== 'user') {
      return HttpResponse.json(
        { message: '用户名或密码错误' },
        { status: 401 },
      )
    }
    if (body.password !== '123456') {
      return HttpResponse.json(
        { message: '用户名或密码错误' },
        { status: 401 },
      )
    }

    const isAdmin = body.username === 'admin'

    return HttpResponse.json({
      token: faker.string.uuid(),
      user: {
        id: faker.string.uuid(),
        username: body.username,
        roles: isAdmin ? ['admin'] : ['viewer'],
        permissions: isAdmin
          ? [
              'dashboard:view',
              'workflow:view',
              'workflow:edit',
              'manage:view',
              'manage:edit',
              'monitor:view',
              'monitor:edit',
            ]
          : ['dashboard:view', 'workflow:view'],
      },
    })
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    await delay(100)
    return new HttpResponse(null, { status: 204 })
  }),
]
