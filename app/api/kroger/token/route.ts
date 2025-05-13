import { NextResponse } from "next/server"
import axios from "axios"

export async function POST() {
  try {
    const clientId = process.env.KROGER_CLIENT_ID
    const clientSecret = process.env.KROGER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Kroger API credentials are not configured" }, { status: 500 })
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    // Make request to Kroger OAuth endpoint
    const response = await axios.post(
      "https://api.kroger.com/v1/connect/oauth2/token",
      "grant_type=client_credentials&scope=product.compact",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
      },
    )

    // Return the token
    return NextResponse.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    })
  } catch (error) {
    console.error("Error getting Kroger token:", error)

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: "Failed to get Kroger token",
          details: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 },
      )
    }

    return NextResponse.json({ error: "Failed to get Kroger token" }, { status: 500 })
  }
}
