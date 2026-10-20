/* T3 联调冒烟：模拟 http://localhost:5173 origin 直连后端 API */
const BASE = 'http://localhost:8080/api'
const ORIGIN = 'http://localhost:5173'

async function req(path, { method = 'GET', body, cookie } = {}) {
  const headers = { Origin: ORIGIN }
  if (body) headers['Content-Type'] = 'application/json'
  if (cookie) headers['Cookie'] = cookie
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return {
    status: res.status,
    cors: res.headers.get('access-control-allow-origin'),
    corsCred: res.headers.get('access-control-allow-credentials'),
    setCookie: res.headers.get('set-cookie'),
    data,
  }
}

function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`)
  if (!ok) process.exitCode = 1
}

const r1 = await req('/dishes/hot')
check('公开接口 /dishes/hot', r1.data?.code === 1 && Array.isArray(r1.data.data),
  `code=${r1.data?.code} records=${r1.data?.data?.length} CORS=${r1.cors} cred=${r1.corsCred}`)

const r2 = await req('/dishes?page=1&pageSize=2')
check('分页接口 /dishes', r2.data?.code === 1 && r2.data.data?.records !== undefined,
  `total=${r2.data?.data?.total} pageSize=${r2.data?.data?.pageSize}`)

const r3 = await req('/cart')
check('未登录 /cart 返回 code=401（HTTP 200）', r3.status === 200 && r3.data?.code === 401,
  `status=${r3.status} code=${r3.data?.code}`)

const r4 = await req('/user/login', { method: 'POST', body: { username: 'test', password: '123456' } })
const jsession = (r4.setCookie || '').match(/JSESSIONID=[^;]+/)?.[0]
check('登录 test/123456 并下发 JSESSIONID', r4.data?.code === 1 && !!jsession,
  `code=${r4.data?.code} msg=${r4.data?.msg} cookie=${jsession}`)

if (jsession) {
  const r5 = await req('/user/info', { cookie: jsession })
  check('携带 Cookie /user/info', r5.data?.code === 1 && !!r5.data.data?.username,
    `username=${r5.data?.data?.username} nickname=${r5.data?.data?.nickname}`)

  const r6 = await req('/cart', { cookie: jsession })
  check('携带 Cookie /cart', r6.data?.code === 1 && Array.isArray(r6.data.data),
    `items=${r6.data?.data?.length} count=${(r6.data?.data || []).reduce((s, i) => s + (i.quantity || 0), 0)}`)

  const r7 = await req('/user/logout', { method: 'POST', cookie: jsession })
  check('退出登录', r7.data?.code === 1, `msg=${r7.data?.msg}`)
}
