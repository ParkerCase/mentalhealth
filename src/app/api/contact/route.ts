import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, user_id } = await req.json()
    
    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    // Create Supabase client with service role key for admin privileges
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: () => '', set: () => {}, remove: () => {} } }
    )

    // Store in database first
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        user_id: user_id || null,
        status: 'new'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      console.error('Error details:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      return NextResponse.json({ error: 'Failed to save contact submission' }, { status: 500 })
    }

    // Send email notification using Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      const { data, error } = await resend.emails.send({
        from: 'AriseDivineMasculine <noreply@arisedivinemasculine.com>',
        to: ['info@arisedivinemasculine.com'],
        subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong style="color: #374151;">From:</strong> ${name} (${email})</p>
              <p><strong style="color: #374151;">Subject:</strong> ${subject || 'No Subject'}</p>
              <p><strong style="color: #374151;">Submitted:</strong> ${new Date().toLocaleString()}</p>
              ${user_id ? `<p><strong style="color: #374151;">User ID:</strong> ${user_id}</p>` : ''}
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
              <p style="line-height: 1.6; color: #374151; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px;">
                This message was sent from the contact form on AriseDivineMasculine.com
              </p>
            </div>
          </div>
        `
      })

      if (error) {
        console.error('Resend email error:', error)
        // Don't fail the request if email fails, just log it
      } else {
        console.log('Email sent successfully:', data)
      }
      
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contact form submitted successfully' 
    })

  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 