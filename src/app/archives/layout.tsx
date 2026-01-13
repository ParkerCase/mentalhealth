// Layout to ensure archives pages are never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ArchivesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


