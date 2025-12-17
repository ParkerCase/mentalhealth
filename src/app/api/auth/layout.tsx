// Layout to ensure auth pages are never statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

