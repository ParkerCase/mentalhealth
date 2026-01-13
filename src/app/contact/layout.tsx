// Layout to ensure contact page is never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


