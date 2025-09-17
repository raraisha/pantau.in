import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const config = {
  api: {
    bodyParser: false, // biar bisa handle form-data
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const busboy = require("busboy");
    const bb = busboy({ headers: req.headers });

    let userId = "";
    let fileBuffer: Buffer | null = null;
    let fileName = "";

    bb.on("field", (name: string, val: string) => {
      if (name === "userId") userId = val;
    });

    bb.on("file", (name: string, file: any, info: any) => {
      const { filename, mimeType } = info;
      fileName = `${userId}/${uuidv4()}-${filename}`;

      const chunks: Buffer[] = [];
      file.on("data", (d: Buffer) => chunks.push(d));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", async () => {
      if (!fileBuffer || !userId) {
        return res.status(400).json({ error: "File dan userId harus diisi" });
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars") // pastikan bucket "avatars" sudah dibuat
        .upload(fileName, fileBuffer, {
          upsert: true,
        });

      if (uploadError) {
        return res.status(400).json({ error: uploadError.message });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      return res.status(200).json({ avatarUrl: publicUrl });
    });

    req.pipe(bb);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
