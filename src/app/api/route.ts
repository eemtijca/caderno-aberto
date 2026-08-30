import { NextResponse } from "next/server"
import { VERSAO } from "@/lib/versao"

export async function GET() {
  return NextResponse.json({ app: "Caderno Aberto", versao: VERSAO })
}
