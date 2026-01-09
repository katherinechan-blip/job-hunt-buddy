import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { agent_id, user_id, existingData } = await req.json();

    const call = await retell.call.createWebCall({
      agent_id: agent_id,
      
      retell_llm_dynamic_variables: {
        name: existingData?.name || "Candidate", // Added safety check (?) just in case
        qualification: existingData?.qualification,
        has_resume: existingData?.has_resume ? "on file" : "not on file",
        has_cpr: existingData?.has_cpr ? "on file" : "not on file",
        license_info: existingData?.license_status
      },
      
      metadata: {       
        // 👇 MATCHES SUPABASE EDGE FUNCTION NOW
        user_id: user_id 
      }
    });

    return NextResponse.json(call);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
  }
}