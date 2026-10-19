import { createClient } from '@supabase/supabase-js';

const url = 'https://fcsrgzlahxaglbfzwbdq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjc3JnemxhaHhhZ2xiZnp3YmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTk4MDMsImV4cCI6MjEwNTA3NTgwM30.ZgcS-VCt3uDA85ImubQif22UW0Cr0stMxd0PWGRlVe4';

const supabase = createClient(url, key);

async function getToolsTest() {
  let { data, error } = await supabase
    .from("alat")
    .select(`
      *,
      kategori:kategori_id (id, nama)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error with created_at, doing fallback:", error);
    const fallback = await supabase
      .from("alat")
      .select(`
        *,
        kategori:kategori_id (id, nama)
      `);
    data = fallback.data;
  }

  console.log("Returned tools:", JSON.stringify(data, null, 2));
}

getToolsTest();
