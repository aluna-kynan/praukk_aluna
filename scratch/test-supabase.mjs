import { createClient } from '@supabase/supabase-js';

const url = 'https://fcsrgzlahxaglbfzwbdq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjc3JnemxhaHhhZ2xiZnp3YmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTk4MDMsImV4cCI6MjEwNTA3NTgwM30.ZgcS-VCt3uDA85ImubQif22UW0Cr0stMxd0PWGRlVe4';

const supabase = createClient(url, key);

async function test() {
  console.log("--- Testing order by dibuat_pada ---");
  const { data: data1, error: err1 } = await supabase.from('alat').select('*, kategori(id, nama)').order('dibuat_pada', { ascending: false });
  console.log("Result 1 (dibuat_pada):", { data1, err1 });

  console.log("--- Testing order by created_at ---");
  const { data: data2, error: err2 } = await supabase.from('alat').select('*, kategori(id, nama)').order('created_at', { ascending: false });
  console.log("Result 2 (created_at):", { data2, err2 });
}

test();
