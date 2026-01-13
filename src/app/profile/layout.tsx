// Layout to ensure profile page is never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


