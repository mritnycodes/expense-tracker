import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygnyteeendpbjedwzorr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_aKWx6upYV9T-4HdLW7Wptg_fGd6vgre'

export const supabase = createClient(supabaseUrl, supabaseKey)