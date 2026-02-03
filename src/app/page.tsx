import { redirect } from 'next/navigation'

/**
 * Root page redirects to the public home page
 * The public layout group handles the main site with header/footer
 */
export default function RootPage() {
  redirect('/home')
}
