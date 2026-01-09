import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ received: true });

    const payload = JSON.parse(text);
    const { event, call } = payload;
    const user_id = call?.metadata?.user_id;

    // --- 1. SAVE TRANSCRIPT (Standard History) ---
    if (event === 'call_ended' && user_id) {
      await supabase.from('transcripts').insert({
        user_id: user_id,
        content: call.transcript,
        session_number: call.call_id,
        created_at: new Date().toISOString()
      });
      console.log(`✅ Transcript saved for user ${user_id.slice(0, 5)}...`);
    }

    // --- 2. SAVE PREFERENCES (The Intelligence) ---
    if (event === 'call_analyzed' && user_id) {
      // Logic: Retell sometimes nests data in 'call_analysis' or 'analysis'
      const analysisData = call.call_analysis || call.analysis || {};
      const vars = analysisData.custom_analysis_data || {};

      if (Object.keys(vars).length > 0) {
        // Fetch existing data to avoid overwriting unrelated fields
        const { data: user } = await supabase.from('users').select('profile_json').eq('id', user_id).single();
        const old = user?.profile_json || {};

        const updatedProfile = {
          ...old,
          last_updated: new Date().toISOString(),
          last_talk_summary: analysisData.call_summary || old.last_talk_summary,
          
          // Map extracted variables to DB Schema
          min_pay: vars.ideal_pay ?? old.min_pay,
          preferred_role: vars.target_role ?? old.preferred_role,
          max_distance: vars.max_commute ?? old.max_distance,
          years_experience: vars.years_experience ?? old.years_experience,
          schedule: vars.schedule_preference ?? old.schedule,
          dealbreakers: vars.dealbreakers ?? old.dealbreakers,
          open_to_other_roles: vars.open_to_other_roles ?? old.open_to_other_roles
        };

        const { error } = await supabase
          .from('users')
          .update({ profile_json: updatedProfile, last_call_at: new Date().toISOString() })
          .eq('id', user_id);

        if (error) {
          console.error("❌ DB Update Failed:", error.message);
        } else {
          console.log(`✅ Preferences Updated! Pay: $${vars.ideal_pay}, Role: ${vars.target_role}`);
        }
      } else {
        console.warn("⚠️ Call analyzed, but no custom variables were found.");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}