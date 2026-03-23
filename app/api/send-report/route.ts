import { Resend } from 'resend';
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, scanId } = await request.json();
    
    if (!email || !scanId) {
      return NextResponse.json({ error: 'Email and scanId required' }, { status: 400 });
    }

    // Fetch scan data from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: scan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();
    
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Build the top 3 findings
    const conditions = scan.conditions || [];
    const topFindings = conditions.slice(0, 3).map((c: any) => 
      `• ${c.name || c.condition} (${c.severity || 'detected'}) — ${c.area || c.location || 'face'}`
    ).join('\n');
    
    const scoreKiller = scan.score_killer || 'Complete your analysis to see recommendations';

    // Send email via Resend
    const result = await resend.emails.send({
      from: 'Mogly <onboarding@resend.dev>',
      to: email,
      subject: `Your Mogly Skin Report — Score: ${scan.overall_score}/100`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #0A0A12; color: #e2e2e8; padding: 32px; border-radius: 16px;">
          <h1 style="text-align: center; color: #00E5A0; font-size: 18px; letter-spacing: 2px; margin: 0; font-weight: 700;">MOGLY SKIN ANALYSIS</h1>
          
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 72px; font-weight: 700; color: #00E5A0; line-height: 1;">${scan.overall_score}</span>
            <span style="font-size: 24px; color: #666; margin-left: 4px;">/100</span>
          </div>
          
          <div style="text-align: center; color: #888; margin-bottom: 32px; font-size: 13px;">
            Skin Age: ${scan.skin_age || 'N/A'} | Top ${100 - scan.overall_score}%
          </div>
          
          <div style="background: #141420; border-left: 3px solid #00E5A0; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #FFD700; font-size: 12px; letter-spacing: 1px; margin: 0 0 12px 0; text-transform: uppercase;">Your Top Findings</h2>
            <div style="color: #bbb; font-size: 13px; line-height: 1.8; white-space: pre-wrap; font-family: monospace;">${topFindings || 'Complete a scan to see your findings'}</div>
          </div>
          
          <div style="background: #141420; border-left: 3px solid #FF6B6B; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
            <h2 style="color: #FF6B6B; font-size: 12px; letter-spacing: 1px; margin: 0 0 12px 0; text-transform: uppercase;">Primary Concern</h2>
            <p style="color: #bbb; font-size: 13px; line-height: 1.6; margin: 0;">${scoreKiller}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://mogly-amber.vercel.app/results/${scanId}" style="background: #00E5A0; color: black; padding: 12px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Full Report</a>
          </div>
          
          <p style="text-align: center; color: #444; font-size: 11px; margin: 32px 0 0 0; line-height: 1.6;">
            Re-scan in 7 days to track your progress.<br>
            <strong>mogly.app</strong> — AI Skin Analysis
          </p>
        </div>
      `
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Email route error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
