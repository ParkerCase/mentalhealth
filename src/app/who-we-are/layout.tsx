// Layout to ensure who-we-are page is never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function WhoWeAreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


