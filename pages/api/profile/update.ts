import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, fullName, avatarUrl } = req.body;

    const { error } = await supabase
      .from("users") // ganti sesuai nama tabelmu
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
      })
      .eq("id", userId);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
