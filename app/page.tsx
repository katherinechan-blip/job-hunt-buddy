'use client';

import { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";

const AGENT_ID = process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [retellClient, setRetellClient] = useState<RetellWebClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- MATCHMAKER STATE ---
  const [matches, setMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const client = new RetellWebClient();
    setRetellClient(client);

    client.on("call_started", () => {
      console.log("Call started!");
      setIsListening(true);
      setIsLoading(false);
      setMatches([]); // Clear old matches when a new call starts
    });

    client.on("call_ended", () => {
      console.log("Call ended!");
      setIsListening(false);
      setIsLoading(false);
      
      // TRIGGER MATCHMAKER: Wait 3 seconds for the webhook to finish saving data
      setTimeout(() => {
        handleGetMatches();
      }, 5000);
    });

    client.on("error", (error) => {
      console.error("Retell Error:", error);
      setIsListening(false);
      setIsLoading(false);
    });
  }, []);

  // --- FUNCTION TO FETCH MATCHES ---
  const handleGetMatches = async () => {
    setIsMatching(true);
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: "dc9f481a-40fe-4b5c-9e3c-b2b9f40ef545" }),
      });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error("Matchmaker failed:", err);
    } finally {
      setIsMatching(false);
    }
  };

  const toggleCall = async () => {
    if (isLoading) return; 
    if (!retellClient) return;

    if (isListening) {
      retellClient.stopCall();
    } else {
      setIsLoading(true);

      try {
        // PASSING KATHERINE'S DATA TO THE API
        const response = await fetch('/api/retell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            agent_id: AGENT_ID,
            user_id: "dc9f481a-40fe-4b5c-9e3c-b2b9f40ef545",
            existingData: {
              name: "Katherine",
              qualification: "CNA",
              has_resume: true,
              has_cpr: true,
              license_status: "Active"
            }
          }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        await retellClient.startCall({
          accessToken: data.access_token,
        });

      } catch (err: any) {
        console.error("Failure:", err);
        alert("Failed to start: " + err.message);
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50 text-black">
      <div className="max-w-2xl w-full flex flex-col items-center space-y-8 mt-20">
        
        <h1 className="text-5xl font-bold tracking-tight">Nia</h1>
        <p className="text-gray-500 text-lg">Your Personal Job Hunt Buddy</p>

        {/* THE MIC BUTTON */}
        <button
          onClick={toggleCall}
          disabled={isLoading} 
          className={`p-10 rounded-full transition-all duration-500 ${
            isListening 
              ? 'bg-red-500 animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
              : isLoading 
                ? 'bg-gray-300' 
                : 'bg-black hover:scale-105 shadow-xl'
          }`}
        >
          {isLoading ? (
             <div className="animate-spin h-14 w-14 border-4 border-white border-t-transparent rounded-full" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-14 h-14">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <p className="text-sm font-medium text-gray-400">
          {isLoading ? "Connecting..." : (isListening ? "Nia is listening to Katherine..." : "Tap to start interview")}
        </p>

        {/* --- MATCHES DISPLAY AREA --- */}
        <div className="w-full pt-10">
          {isMatching && (
            <div className="flex flex-col items-center space-y-2 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
              <p className="text-sm text-gray-500">Nia is analyzing your preferences...</p>
            </div>
          )}

          {matches.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h2 className="text-2xl font-bold border-b pb-2">Katherine's Top Matches</h2>
              {matches.map((job, i) => (
                <div key={i} className="group p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-500 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">{job.job_title}</h3>
                      <p className="text-gray-500">{job.facility_name}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                      {job.match_score}% Match
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 italic text-sm text-blue-900">
                    "{job.reason_why}"
                  </div>
                  <button className="mt-4 w-full py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                    Apply with Nia
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}