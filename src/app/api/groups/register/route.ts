import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { Database } from '@/lib/types/database.types'
import { GroupFormData, Group } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const groupData = await req.json() as GroupFormData
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'city', 'state', 'zip', 'email'] as Array<keyof GroupFormData>
    for (const field of requiredFields) {
      if (!groupData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Insert group data into the database
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        location: groupData.location || null,
        address: groupData.address || null,
        city: groupData.city,
        state: groupData.state,
        zip: groupData.zip,
        website: groupData.website || null,
        email: groupData.email,
        phone: groupData.phone || null,
        approved: false, // Groups require approval before being public
      })
      .select() as { data: Group[] | null; error: Error | null }

    if (error) {
      console.error('Group registration error:', error)
      return NextResponse.json({ error: 'Failed to register group' }, { status: 500 })
    }

    // Return the newly created group
    return NextResponse.json({ success: true, group: data?.[0] || null })
  } catch (error) {
    console.error('Group registration API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}