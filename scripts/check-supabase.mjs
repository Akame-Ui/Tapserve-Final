#!/usr/bin/env node
/**
 * Verifies the Supabase project URL / anon key in .env.local and checks that
 * the TapServe schema response is reachable.
 *
 * Usage: npm run check:supabase
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')

function readEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const separator = line.indexOf('=')
          if (separator === -1) return [line, '']
          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
        })
    )
  } catch {
    return {}
  }
}

const env = readEnv(envPath)
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('✖ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  console.error('  Copy .env.example to .env.local and add the values from your Supabase project.')
  process.exit(1)
}

if (url.includes('your-project-ref') || anonKey.includes('your-anon-key')) {
  console.error('✖ .env.local still contains the example placeholders.')
  process.exit(1)
}

console.log(`→ Checking ${url} …`)

try {
  const health = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: anonKey },
  })

  if (!health.ok) {
    console.error(`✖ Auth endpoint returned HTTP ${health.status}. Check the URL and anon key.`)
    process.exit(1)
  }

  console.log('✔ Supabase auth endpoint reachable.')

  const bookings = await fetch(`${url}/rest/v1/bookings?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  if (bookings.status === 404) {
    console.error('✖ Connected, but the bookings table is missing. Run supabase/0001_init.sql.')
    process.exit(1)
  }

  if (bookings.status === 401 || bookings.status === 403) {
    console.log('✔ bookings table exists; anonymous access is blocked by RLS (expected).')
  } else if (bookings.ok) {
    console.log('✔ bookings table reachable.')
  } else {
    console.warn(`⚠ bookings endpoint returned HTTP ${bookings.status}. Check the migration and RLS policies.`)
  }

  const events = await fetch(`${url}/rest/v1/events?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  if (events.status === 404) {
    console.warn('⚠ Admin schema not found. Run supabase/0002_admin.sql to enable the administrator console.')
  } else if (events.ok) {
    console.log('✔ events table exists; published events are publicly readable.')
  } else {
    console.warn(`⚠ events endpoint returned HTTP ${events.status}. Check 0002_admin.sql.`)
  }

  const adminExists = await fetch(`${url}/rest/v1/rpc/admin_exists`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (adminExists.status === 404) {
    console.warn('⚠ First-admin signup not installed. Run supabase/0003_admin_signup.sql.')
  } else if (adminExists.ok) {
    const exists = await adminExists.json()
    console.log(
      exists === true
        ? '✔ Administrator bootstrap installed; an administrator already exists.'
        : '✔ Administrator bootstrap installed; first-admin signup is available.'
    )
  } else {
    console.warn(`⚠ admin_exists returned HTTP ${adminExists.status}. Check 0003_admin_signup.sql.`)
  }

  const adminCount = await fetch(`${url}/rest/v1/rpc/admin_count`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (adminCount.status === 404) {
    console.warn('⚠ Single-admin enforcement not installed. Run supabase/0004_single_admin.sql.')
  } else if (adminCount.ok) {
    const count = await adminCount.json()

    if (count === 0) {
      console.log('✔ No administrator configured; first-admin signup is available.')
    } else if (count === 1) {
      console.log('✔ Exactly one administrator is configured.')
    } else {
      console.warn(
        `⚠ ${count} administrators found. Run supabase/0004_single_admin.sql to keep only one.`
      )
    }
  } else {
    console.warn(`⚠ admin_count returned HTTP ${adminCount.status}. Check 0004_single_admin.sql.`)
  }

  console.log('✅ Supabase connection verified.')
} catch (error) {
  console.error('✖ Could not reach Supabase:', error instanceof Error ? error.message : error)
  process.exit(1)
}
