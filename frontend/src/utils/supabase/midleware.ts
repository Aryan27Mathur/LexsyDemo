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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based routing for authenticated users
  if (user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    try {
      // Get user role from employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('qms_access')
        .eq('email', user.email)
        .single()

      if (!employeeError && employeeData) {
        const userRole = employeeData.qms_access
        
        // Handle root path redirects based on role
        if (request.nextUrl.pathname === '/') {
          const url = request.nextUrl.clone()
          if (userRole === 'Standard User') {
            url.pathname = '/standard/home'
          } else {
            // Default to dashboard for admins and other roles
            url.pathname = '/home'
          }
          return NextResponse.redirect(url)
        }

        // Redirect Standard Users trying to access dashboard routes to standard routes
        if (userRole === 'Standard User' && !request.nextUrl.pathname.startsWith('/standard')) {
          // If they're trying to access a dashboard route, redirect to standard equivalent
          const url = request.nextUrl.clone()
          url.pathname = '/standard' + request.nextUrl.pathname
          return NextResponse.redirect(url)
        }
        
        // Redirect non-Standard Users trying to access standard routes to dashboard
        if (userRole !== 'Standard User' && request.nextUrl.pathname.startsWith('/standard')) {
          const url = request.nextUrl.clone()
          url.pathname = request.nextUrl.pathname.replace('/standard', '')
          return NextResponse.redirect(url)
        }
      }
    } catch (error) {
      console.error('Error in role-based routing:', error)
      // Continue with normal flow if there's an error
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}