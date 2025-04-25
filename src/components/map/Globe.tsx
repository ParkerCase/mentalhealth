'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the Globe component with no SSR
const DynamicGlobe = dynamic(() => import('./GlobeImpl'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-md">
      <div className="text-gray-500">Loading 3D globe...</div>
    </div>
  )
})

export default function GlobeComponent() {
  return (
    <div className="h-[400px]">
      <Suspense fallback={
        <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-500">Loading 3D globe...</div>
        </div>
      }>
        <DynamicGlobe />
      </Suspense>
    </div>
  )
}