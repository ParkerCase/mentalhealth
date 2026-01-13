// Layout to ensure locator page is never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function LocatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


