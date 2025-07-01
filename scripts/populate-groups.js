#!/usr/bin/env node

// Script to populate the groups table with men's organizations
// Run with: node scripts/populate-groups.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in environment');
  process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key-here') {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment');
  console.log('📝 Please add your service role key to .env.local');
  console.log('🔗 Get it from: https://supabase.com/dashboard/project/ldpfadlrxmmgsttkjwop/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const organizations = [
  {
    name: 'The ManKind Project',
    description: 'A global network of men committed to creating a world where men can be emotionally intelligent, accountable, and connected. MKP provides transformational programs and ongoing support for men seeking personal growth.',
    address: '2045 W Grand Ave Ste B PMB 56991',
    city: 'Chicago',
    state: 'IL',
    zip: '60612-1577',
    website: 'https://mankindproject.org',
    email: 'info@mankindproject.org',
    phone: '1-800-870-4611',
    lat: 41.8781,
    lng: -87.6298
  },
  {
    name: 'Evryman',
    description: 'Creating deep connections and meaningful community for men through groups, retreats, and workshops. Focused on vulnerability, emotional intelligence, and authentic relationships.',
    address: '4724 Hollywood Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90027',
    website: 'https://evryman.com',
    email: 'info@evryman.com',
    phone: null,
    lat: 34.0522,
    lng: -118.2437
  },
  {
    name: 'Sacred Sons',
    description: 'A community of men dedicated to authentic connection, personal growth, and living with purpose. Offers men\'s circles, retreats, and coaching programs.',
    address: '9940 Summers Ridge Rd',
    city: 'San Diego',
    state: 'CA',
    zip: '92121',
    website: 'https://sacredsons.com',
    email: 'info@sacredsons.com',
    phone: null,
    lat: 32.7157,
    lng: -117.1611
  },
  {
    name: 'Unravel Groups',
    description: 'Modern men\'s groups focused on emotional intelligence, vulnerability, and authentic connection. Provides both virtual and in-person group experiences.',
    address: '133 NE 2nd Ave Ste 3315',
    city: 'Miami',
    state: 'FL',
    zip: '33132',
    website: 'https://unravelgroups.com',
    email: 'hello@unravelgroups.com',
    phone: null,
    lat: 25.7617,
    lng: -80.1918
  },
  {
    name: 'MensGroup',
    description: 'Online and in-person support groups for men dealing with various life challenges and transitions. Focuses on mental health, relationships, and personal development.',
    address: '2611 W 19th Ave Ste 400',
    city: 'Seattle',
    state: 'WA',
    zip: '98123',
    website: 'https://mensgroup.com',
    email: 'info@mensgroup.com',
    phone: null,
    lat: 47.6062,
    lng: -122.3321
  },
  {
    name: 'A Call to Men',
    description: 'Leading the effort to create a world where all men and boys are loving and respectful and all women and girls are valued and safe. Focuses on healthy masculinity education.',
    address: '250 Merrick Rd #813',
    city: 'Rockville Centre',
    state: 'NY',
    zip: '11570',
    website: 'https://acalltomen.org',
    email: 'info@acalltomen.org',
    phone: '917-922-6738',
    lat: 40.6584,
    lng: -73.6401
  },
  {
    name: 'Equimundo',
    description: 'Formerly Promundo-US. Works to advance gender equality and social justice by engaging men and boys in transforming masculinities and addressing structural inequalities.',
    address: '1367 Connecticut Ave NW Ste 210',
    city: 'Washington',
    state: 'DC',
    zip: '20036',
    website: 'https://equimundo.org',
    email: 'info@promundoglobal.org',
    phone: '(202) 588-0061',
    lat: 38.9072,
    lng: -77.0369
  },
  {
    name: 'Inside Circle',
    description: 'Creating powerful healing communities within and beyond prison walls. Focuses on restorative justice, emotional healing, and community building among incarcerated and formerly incarcerated men.',
    address: '2443 Fillmore St #380-4123',
    city: 'San Francisco',
    state: 'CA',
    zip: '94115',
    website: 'https://insidecircle.org',
    email: 'info@insidecircle.org',
    phone: null,
    lat: 37.7749,
    lng: -122.4194
  },
  {
    name: 'Cave of Adullam (CATTA)',
    description: 'A Detroit-based organization focused on mentoring and supporting young men through life challenges. Provides community programming, support groups, and leadership development.',
    address: '1129 Oakman Blvd',
    city: 'Detroit',
    state: 'MI',
    zip: '48238',
    website: 'https://thecaveofadullam.org',
    email: 'info@thecaveofadullam.org',
    phone: '313-870-9771',
    lat: 42.3314,
    lng: -83.0458
  },
  {
    name: 'Brothers (We Are Brothers)',
    description: 'A Norwegian-based international organization focused on authentic brotherhood and men\'s personal development. Provides men\'s groups, events, and community building activities.',
    address: 'St. Olavs Gate 24',
    city: 'Oslo',
    state: null,
    zip: '0166',
    website: 'https://wearebrothers.org',
    email: 'info@brothersorganization.org',
    phone: '+47 416 94 104',
    lat: 59.9139,
    lng: 10.7522
  }
];

async function populateGroups() {
  console.log('🚀 Starting to populate groups database...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const org of organizations) {
    try {
      console.log(`⏳ Inserting: ${org.name}...`);
      
      // Try inserting without geo_location first, then update with spatial data
      const { data: insertedGroup, error: insertError } = await supabase
        .from('groups')
        .insert({
          name: org.name,
          description: org.description,
          address: org.address,
          city: org.city,
          state: org.state,
          zip: org.zip,
          website: org.website,
          email: org.email,
          phone: org.phone,
          approved: true
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error(`❌ Error inserting ${org.name}:`, insertError.message);
        errorCount++;
        continue;
      }
      
      // Now update with geo_location using raw SQL
      const { error: updateError } = await supabase.rpc('update_group_location', {
        group_id: insertedGroup.id,
        latitude: org.lat,
        longitude: org.lng
      });
      
      if (updateError) {
        console.log(`⚠️  ${org.name} inserted but location update failed:`, updateError.message);
        console.log(`   Will try alternative method...`);
        
        // Alternative: Try direct SQL update
        const { error: sqlError } = await supabase
          .from('groups')
          .update({ 
            geo_location: `POINT(${org.lng} ${org.lat})`
          })
          .eq('id', insertedGroup.id);
        
        if (sqlError) {
          console.log(`   ⚠️  Location update failed, but group is inserted`);
        } else {
          console.log(`   ✅ Location updated successfully`);
        }
      }
      
      console.log(`✅ Successfully inserted: ${org.name}`);
      successCount++;
      
    } catch (err) {
      console.error(`❌ Failed to insert ${org.name}:`, err.message);
      errorCount++;
    }
  }
  
  console.log('\n🎉 Database population completed!');
  console.log(`✅ Successfully inserted: ${successCount} groups`);
  if (errorCount > 0) {
    console.log(`❌ Failed to insert: ${errorCount} groups`);
  }
  console.log('\n🌐 Your groups should now be visible in the Locator!');
}

// Run the script
if (require.main === module) {
  populateGroups().catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { populateGroups, organizations };
