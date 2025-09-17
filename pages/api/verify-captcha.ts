import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const { token } = req.body
    const secret = process.env.HCAPTCHA_SECRET_KEY

    const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `response=${token}&secret=${secret}`,
    })

    const data = await verifyRes.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}
