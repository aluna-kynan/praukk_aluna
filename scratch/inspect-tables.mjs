import { createClient } from '@supabase/supabase-js';

const url = 'https://fcsrgzlahxaglbfzwbdq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjc3JnemxhaHhhZ2xiZnp3YmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTk4MDMsImV4cCI6MjEwNTA3NTgwM30.ZgcS-VCt3uDA85ImubQif22UW0Cr0stMxd0PWGRlVe4';

const supabase = createClient(url, key);

async function inspect() {
  const tables = ['pengguna', 'kategori', 'alat', 'peminjaman', 'pengembalian', 'log_aktivitas'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table '${t}':`, { data, error });
  }
}

inspect();
