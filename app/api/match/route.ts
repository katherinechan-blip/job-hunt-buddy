import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize the "Secret" server-side tools
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    // 1. Fetch Solomon's Profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('profile_json')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error("Candidate not found");

    // 2. Fetch your 5 fake jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*');

    if (jobsError) throw new Error("Jobs not found");

    // 3. Ask OpenAI to be the "Recruiter"
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert healthcare recruiter. 
          Analyze the candidate's JSON profile and compare it to the list of available jobs.
          Pick the top 5 matches. 
          Return ONLY a JSON object with a key 'matches' containing an array of jobs.
          Each job in the array should include: job_title, facility_name, match_score (0-100), and a brief 'reason_why'.`
        },
        {
          role: "user",
          content: `Candidate Profile: ${JSON.stringify(user.profile_json)} 
                    Available Jobs: ${JSON.stringify(jobs)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Matchmaker Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}