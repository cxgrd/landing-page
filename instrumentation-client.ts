import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: false,
  capture_pageleave: true,
})

export function onRouterTransitionStart(url: string) {
  posthog.capture('$pageview', { $current_url: url })
}
