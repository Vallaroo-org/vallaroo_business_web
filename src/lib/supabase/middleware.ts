import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // 1. Authenticated users should not see login/signup pages
    if (user && (path.startsWith('/login') || path.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Unauthenticated users trying to access protected routes
    if (
        !user &&
        !path.startsWith('/login') &&
        !path.startsWith('/signup') &&
        !path.startsWith('/auth') &&
        !path.startsWith('/api/webhooks') &&
        !path.startsWith('/api/debug')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('next', path)
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
