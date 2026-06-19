import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbjsasgcsujggnzvidyj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhianNhc2djc3VqZ2duenZpZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTkwMjU4NiwiZXhwIjoyMDk3NDc4NTg2fQ.z33S-eHKLezSyZROtGCLKAXSqVCBFFCgnF4xE9S2h8k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'ahmed-saado@gmx.de');
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    console.log('Profile found:', profile);
  } else {
    console.log('User not found');
  }
}

checkProfile();
