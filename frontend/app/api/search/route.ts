import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();

  const all = [
    {
      id: "1",
      channel: "whatsapp",
      snippet: "Send 0.5 BTC to the address we discussed",
      timestampISO: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      fullText:
        "Hey, can you send 0.5 BTC to the address we discussed yesterday?",
    },
    {
      id: "2",
      channel: "sms",
      snippet: "Payment confirmation received",
      timestampISO: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      fullText: "Your payment has been confirmed. Thank you!",
    },
  ];

  const filtered = q
    ? all.filter(
        (i) =>
          i.snippet.toLowerCase().includes(q) ||
          i.fullText.toLowerCase().includes(q),
      )
    : all;

  return NextResponse.json({
    total: filtered.length,
    items: filtered.slice(0, 20),
  });
}
