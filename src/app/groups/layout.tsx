// Layout to ensure groups pages are never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

